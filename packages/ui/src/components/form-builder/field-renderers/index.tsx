"use client";

import type { Control, FieldValues } from "react-hook-form";

import type { FormFieldSchema } from "@shared/form";

import { AddressFieldRenderer } from "./address-field";
import { CheckboxFieldRenderer } from "./checkbox-field";
import { DateFieldRenderer } from "./date-field";
import { EmailFieldRenderer } from "./email-field";
import { FileFieldRenderer } from "./file-field";
import { HeadingFieldRenderer } from "./heading-field";
import { NumberFieldRenderer } from "./number-field";
import { PhoneFieldRenderer } from "./phone-field";
import { RadioFieldRenderer } from "./radio-field";
import { SelectFieldRenderer } from "./select-field";
import { StudentLookupFieldRenderer } from "./student-lookup-field";
import { TextFieldRenderer } from "./text-field";

export function FieldRenderer({
  field,
  control,
}: {
  field: FormFieldSchema;
  control: Control<FieldValues>;
}) {
  switch (field.type) {
    case "text":
      return <TextFieldRenderer field={field} control={control} />;
    case "number":
    case "scoring":
      return <NumberFieldRenderer field={field} control={control} />;
    case "date":
      return <DateFieldRenderer field={field} control={control} />;
    case "select":
      return <SelectFieldRenderer field={field} control={control} />;
    case "file":
      return <FileFieldRenderer field={field} control={control} />;
    case "email":
      return <EmailFieldRenderer field={field} control={control} />;
    case "phone":
      return <PhoneFieldRenderer field={field} control={control} />;
    case "radio":
      return <RadioFieldRenderer field={field} control={control} />;
    case "checkbox":
      return <CheckboxFieldRenderer field={field} control={control} />;
    case "address":
      return <AddressFieldRenderer field={field} control={control} />;
    case "heading":
      return <HeadingFieldRenderer field={field} />;
    case "studentLookup":
      return <StudentLookupFieldRenderer field={field} control={control} />;
  }
}
