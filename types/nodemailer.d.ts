declare module "nuxt-nodemailer" {
  interface NuxtNodemailerOptions {
    service: string;
    from?: string;
    auth: {
      user: string;
      pass: string;
    };
  }
}
