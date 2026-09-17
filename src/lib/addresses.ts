import { prisma } from "@/lib/prisma";
import { isUniqueViolation, violatedConstraint } from "@/lib/prisma-errors";

/** The partial unique index behind "one default address per customer". */
const ONE_DEFAULT_INDEX = "addresses_one_default_per_customer";

export interface AddressFields {
  label: string;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  line: string;
  isDefault: boolean;
}

/**
 * A default is set in two steps inside a transaction: clear the customer's
 * others, then set the one. Two of those racing for the same customer both
 * clear and both set, and the partial unique index (migration
 * 20260917140000_one_default_address) refuses the second. It is then run
 * once more from the top, so the last writer wins and a customer is never
 * left with two defaults. Anything else, and a second refusal, come back to
 * the caller.
 */
async function onceMoreIfSecondDefault<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (!isUniqueViolation(error) || violatedConstraint(error) !== ONE_DEFAULT_INDEX) {
      throw error;
    }
    return write();
  }
}

/**
 * Creates the address, or updates it when `addressId` is given. The
 * customerId in the update's filter stops one reader editing another's row.
 */
export function saveAddressRow(
  customerId: string,
  fields: AddressFields,
  addressId?: string,
): Promise<void> {
  return onceMoreIfSecondDefault(() =>
    prisma.$transaction(async (tx) => {
      if (fields.isDefault) {
        await tx.address.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      if (addressId) {
        await tx.address.updateMany({
          where: { id: addressId, customerId },
          data: fields,
        });
        return;
      }

      await tx.address.create({ data: { ...fields, customerId } });
    }),
  );
}

/** Makes one of the customer's addresses the default, and the others not. */
export function makeDefaultAddress(customerId: string, addressId: string): Promise<unknown> {
  return onceMoreIfSecondDefault(() =>
    prisma.$transaction([
      prisma.address.updateMany({ where: { customerId }, data: { isDefault: false } }),
      prisma.address.updateMany({
        where: { id: addressId, customerId },
        data: { isDefault: true },
      }),
    ]),
  );
}
