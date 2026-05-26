"use client";

import {
  VN_PROVINCE_NAMES,
  vnDistrictsOf,
  vnWardsOf,
  type AddressField as AddressFieldSchema,
  type AddressValue,
} from "@shared/form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

import type { FieldProps } from "./types";

// VN administrative levels are fixed domain terms; default locale is `vi`.
const PLACEHOLDERS = {
  province: "Tỉnh / Thành phố",
  district: "Quận / Huyện",
  ward: "Phường / Xã",
} as const;

const EMPTY: AddressValue = { province: "", district: "", ward: "" };

export function AddressFieldRenderer({
  field,
  control,
}: FieldProps<AddressFieldSchema>) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        const value = { ...EMPTY, ...((f.value as Partial<AddressValue>) ?? {}) };
        const set = (next: Partial<AddressValue>) =>
          f.onChange({ ...value, ...next });

        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormControl>
                <Select
                  value={value.province || undefined}
                  onValueChange={(province) =>
                    set({ province, district: "", ward: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={PLACEHOLDERS.province} />
                  </SelectTrigger>
                  <SelectContent>
                    {VN_PROVINCE_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              <Select
                value={value.district || undefined}
                onValueChange={(district) => set({ district, ward: "" })}
                disabled={!value.province}
              >
                <SelectTrigger>
                  <SelectValue placeholder={PLACEHOLDERS.district} />
                </SelectTrigger>
                <SelectContent>
                  {vnDistrictsOf(value.province).map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={value.ward || undefined}
                onValueChange={(ward) => set({ ward })}
                disabled={!value.district}
              >
                <SelectTrigger>
                  <SelectValue placeholder={PLACEHOLDERS.ward} />
                </SelectTrigger>
                <SelectContent>
                  {vnWardsOf(value.province, value.district).map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
