import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getDbUser() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || "";

    // Find user by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!user) {
      // Create user if not exists
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
          role: "patient",
        },
      });
    } else {
      // Sync user info if it changed
      if (
        user.email !== email ||
        user.firstName !== clerkUser.firstName ||
        user.lastName !== clerkUser.lastName ||
        user.imageUrl !== clerkUser.imageUrl
      ) {
        user = await prisma.user.update({
          where: { clerkId: clerkUser.id },
          data: {
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
          },
        });
      }
    }

    return user;
  } catch (error) {
    console.error("Error in getDbUser:", error);
    return null;
  }
}
