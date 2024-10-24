import { array, mixed, object, string } from "yup";

export const LoginSchema = object({
  email: string().required().label("Email").email(),
  password: string()
    .required()
    .label("Password")
    .min(6)
    .max(20)
    .matches(/^[^<@#`]*$/, "Password cannot contain the characters <, @, `,or #!"),
});

export const ForgotPasswordSchema = object({
  email: string().required().label("Email").email(),
});

export const SearchSchema = object({
  search: string().required().max(50),
});

const isFile = (value: any): value is File => {
  return value && value instanceof File;
};

export const AddProductSchema = object({
  name: string()
    .required()
    .label("Name")
    .max(72)
    .matches(/^[^<@#`]*$/, "Product Name cannot contain the characters <, @, `, or #"),
  category: string().required().label("Category"),
  description: string()
    .label("Description")
    .max(200)
    .matches(/^[^<@#`]*$/, "Description cannot contain the characters <, @, `, or #"),
  status: string().required().label("Set Status"),
  featured_image: mixed()
    .required("Featured image is required")
    .test("fileSize", "File size is too large", (value) => {
      return isFile(value) ? value.size <= 25 * 1024 * 1024 : true; // 25MB
    })
    .test("fileType", "Unsupported file format", (value) => {
      return isFile(value) ? ["image/jpeg", "image/png", "image/gif"].includes(value.type) : true;
    }),
  images: array()
    .of(
      mixed()
        .test("fileSize", "File size is too large", (value) => {
          return isFile(value) ? value.size <= 25 * 1024 * 1024 : true; // 25MB
        })
        .test("fileType", "Unsupported file format", (value) => {
          return isFile(value)
            ? ["image/jpeg", "image/png", "image/gif"].includes(value.type)
            : true;
        })
    )
    .max(5, "You can upload up to 5 images"),
  variations: array().of(mixed()).required().min(1, "At least one variation is required"),
});
