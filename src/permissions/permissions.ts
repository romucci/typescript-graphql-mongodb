// RECURSIVE RESOLVER CREATION
const createResolver = resolver => {
  const baseResolver = resolver;
  baseResolver.createResolver = childResolver => {
    const newResolver = async (parent, args, context) => {
      await resolver(parent, args, context);
      return childResolver(parent, args, context);
    };
    return createResolver(newResolver);
  };
  return baseResolver;
};

// AUTHENTICATION PERMISSION
export const requiresAuth = createResolver((parent, args, context) => {
  if (!context.user) {
    throw new Error("User not identified");
  }
});

// ADMIN PERMISSION
export const requiresAdmin = requiresAuth.createResolver(
  (parent, args, context) => {
    if (!context.user.isAdmin) {
      throw new Error("You need admin access");
    }
  }
);
