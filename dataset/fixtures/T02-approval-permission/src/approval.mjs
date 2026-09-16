export function canApprove(user, request) {
  if (user.denied?.includes('approve')) return false;
  return user.permissions?.includes(`approve:${request.type}`) ?? false;
}
