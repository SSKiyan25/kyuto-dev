export interface Organization {
  name: string;
  contactEmail: string;
  address: string;
  addressImages: string[];
  description?: string;
  phoneNumber?: string;
  icon: string;
  images?: string[];
  isVerified: boolean;
  dateCreated: Date;
  accounts: Account[];
}

type Account = {
  accountID: string;
  role: string;
};
