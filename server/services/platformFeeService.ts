import { adminStorage } from "../storage/adminStorage";

export async function calculatePlatformFee(
  amount: number
) {
  const activeFee =
    await adminStorage.getActivePlatformFee();

  // DEFAULT = 20%
  const feeType =
    activeFee?.type ?? "percentage";

  const feeValue =
    Number(activeFee?.value ?? 20);

  let feeAmount = 0;

  if (feeType === "percentage") {
    feeAmount = (amount * feeValue) / 100;
  } else {
    feeAmount = feeValue;
  }

  return {
    platformFeeId: activeFee?.id ?? null,
    platformFeeType: feeType,
    platformFeeValue: feeValue,
    platformFeeAmount: feeAmount,
    vendorEarning: amount - feeAmount,
  };
}