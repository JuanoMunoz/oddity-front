import z from "zod";

export const UserScheme = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    role: z.string().nullable(),
    organizationId: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
})

export const SignUp = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    organizationId: z.number(),
    role: z.string(),
})

export const SignIn = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export type SignUpData = z.infer<typeof SignUp>;
export type SignInData = z.infer<typeof SignIn>;
