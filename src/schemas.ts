export interface IdentifyInput {
  email?: string | undefined;
  phoneNumber?: string | undefined;
}

export interface ContactResponse {
  primaryContatcId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}