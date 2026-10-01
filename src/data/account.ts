import type { Address, Customer } from "@/types";

export const addresses: Address[] = [
  {
    id: "ad1",
    label: { ar: "المنزل" },
    fullName: "مصطفى الجبوري",
    phone: "+964 770 123 4567",
    governorate: { ar: "بغداد" },
    city: { ar: "الكرادة" },
    line: {
      ar: "قرب جامع الحسنين، بناية 12، الطابق الثاني",
    },
    isDefault: true,
  },
  {
    id: "ad2",
    label: { ar: "العمل" },
    fullName: "مصطفى الجبوري",
    phone: "+964 781 998 2210",
    governorate: { ar: "بغداد" },
    city: { ar: "المنصور" },
    line: {
      ar: "شارع 14 رمضان، مقابل مصرف الرافدين",
    },
    isDefault: false,
  },
];

export const customer: Customer = {
  id: "cu1",
  name: "مصطفى الجبوري",
  email: "mustafa@example.com",
  phone: "+964 770 123 4567",
  birthDate: "1994-04-12",
  memberSince: "2024-11-03",
  status: "active",
  addresses,
  stats: {
    orders: 4,
    wishlist: 6,
    copiesBought: 17,
  },
};
