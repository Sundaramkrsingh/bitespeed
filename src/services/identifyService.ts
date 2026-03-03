import { prisma } from '../db/prisma.js';
import type { IdentifyInput, ContactResponse } from '../schemas.js';

export async function identify({ email, phoneNumber }: IdentifyInput): Promise<ContactResponse> {
  // Build OR filter from whatever fields were provided
  const orConditions = [
    ...(email ? [{ email }] : []),
    ...(phoneNumber ? [{ phoneNumber }] : []),
  ];

  // Find all existing contacts that match on email OR phone
  const matchingContacts = await prisma.contact.findMany({
    where: { deletedAt: null, OR: orConditions },
  });

  // No match — this is a brand new customer, create a primary contact
  if (matchingContacts.length === 0) {
    const contact = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: 'PRIMARY',
      },
    });
    return {
      primaryContatcId: contact.id,
      emails: contact.email ? [contact.email] : [],
      phoneNumbers: contact.phoneNumber ? [contact.phoneNumber] : [],
      secondaryContactIds: [],
    };
  }

  // Collect primary IDs: if a matched contact is secondary, its linkedId points to the primary
  const primaryIdSet = new Set<number>();
  for (const c of matchingContacts) {
    if (c.linkPrecedence === 'PRIMARY') {
      primaryIdSet.add(c.id);
    } else if (c.linkedId !== null) {
      primaryIdSet.add(c.linkedId);
    }
  }

  // Fetch all primaries, oldest first — the oldest becomes the "true" primary
  const primaries = await prisma.contact.findMany({
    where: { id: { in: [...primaryIdSet] } },
    orderBy: { createdAt: 'asc' },
  });

  const truePrimary = primaries[0];
  if (!truePrimary) throw new Error('Expected at least one primary contact');

  // If there are multiple primaries (two separate clusters now linked by this request),
  // demote the newer ones to secondary under the oldest primary
  const otherPrimaries = primaries.slice(1);
  if (otherPrimaries.length > 0) {
    const otherIds = otherPrimaries.map(p => p.id);
    await prisma.contact.updateMany({
      where: { id: { in: otherIds } },
      data: { linkPrecedence: 'SECONDARY', linkedId: truePrimary.id },
    });
    // Re-point any secondaries that were under the demoted primaries
    await prisma.contact.updateMany({
      where: { linkedId: { in: otherIds }, deletedAt: null },
      data: { linkedId: truePrimary.id },
    });
  }

  // Fetch the full cluster: the primary + all its secondaries
  const cluster = await prisma.contact.findMany({
    where: {
      deletedAt: null,
      OR: [{ id: truePrimary.id }, { linkedId: truePrimary.id }],
    },
  });

  // If the request brings new info (an email or phone not yet in the cluster), create a new secondary
  const clusterEmails = new Set(cluster.map(c => c.email).filter((e): e is string => e !== null));
  const clusterPhones = new Set(cluster.map(c => c.phoneNumber).filter((p): p is string => p !== null));

  const hasNewEmail = email !== undefined && !clusterEmails.has(email);
  const hasNewPhone = phoneNumber !== undefined && !clusterPhones.has(phoneNumber);

  if (hasNewEmail || hasNewPhone) {
    const newSecondary = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkedId: truePrimary.id,
        linkPrecedence: 'SECONDARY',
      },
    });
    cluster.push(newSecondary);
  }

  const secondaries = cluster.filter(c => c.id !== truePrimary.id);

  // Build deduplicated email/phone lists — primary's values always come first
  const emails = [
    ...(truePrimary.email ? [truePrimary.email] : []),
    ...secondaries.map(c => c.email).filter((e): e is string => e !== null),
  ];
  const phoneNumbers = [
    ...(truePrimary.phoneNumber ? [truePrimary.phoneNumber] : []),
    ...secondaries.map(c => c.phoneNumber).filter((p): p is string => p !== null),
  ];

  return {
    primaryContatcId: truePrimary.id,
    emails: [...new Set(emails)],
    phoneNumbers: [...new Set(phoneNumbers)],
    secondaryContactIds: secondaries.map(c => c.id),
  };
}