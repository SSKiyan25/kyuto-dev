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
      return isFile(value) ? value.size <= 10 * 1024 * 1024 : true; // 10MB
    })
    .test("fileType", "Unsupported file format", (value) => {
      return isFile(value) ? ["image/jpeg", "image/png", "image/gif"].includes(value.type) : true;
    }),
  images: array()
    .of(
      mixed()
        .test("fileSize", "File size is too large", (value) => {
          return isFile(value) ? value.size <= 10 * 1024 * 1024 : true; // 10MB
        })
        .test("fileType", "Unsupported file format", (value) => {
          return isFile(value)
            ? ["image/jpeg", "image/png", "image/gif"].includes(value.type)
            : true;
        })
    )
    .max(5, "You can upload up to 5 images"),
  variations: array()
    .of(mixed())
    .required()
    .min(1, "At least one variation is required")
    .max(10, "You can add up to 10 variations only"),
});

export const EditProfileSchema = object({
  firstname: string()
    .label("First Name")
    .max(50)
    .matches(/^[^<@#`]*$/, "First Name cannot contain the characters <, @, `, or #"),
  lastname: string()
    .label("Last Name")
    .max(50)
    .matches(/^[^<@#`]*$/, "Last Name cannot contain the characters <, @, `, or #"),
  username: string()
    .label("Username")
    .max(30)
    .matches(/^[^<@#`]*$/, "Username cannot contain the characters <, @, `, or #"),
  // email: string().required().label("Email Address").email(),
  phoneNumber: string()
    .label("Phone Number")
    .matches(
      /^\+?[1-9]\d{1,14}$/,
      "Phone Number must be a valid international phone number. Example +639201948834"
    ),
});

export const EditStudentInfoSchema = object({
  studentID: string()
    .label("Student ID")
    .matches(/^\d{2}-\d{1}-\d{4}$/, "Student ID must be in the format XX-X-XXXX"),
  course: string()
    .label("Course")
    .max(50)
    .matches(/^[^<@#`]*$/, "Course cannot contain the characters <, @, `, or #"),
  college: string()
    .label("College")
    .max(50)
    .matches(/^[^<@#`]*$/, "College cannot contain the characters <, @, `, or #"),
});
