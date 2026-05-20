"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  buildZodSchema,
  defaultValuesFor,
  type FormSchema,
} from "@shared/form";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Form } from "@ui/components/form";
import { FormBuilder } from "@ui/components/form-builder";

export function FormBuilderDemo({ schema }: { schema: FormSchema }) {
  const form = useForm({
    resolver: zodResolver(buildZodSchema(schema)),
    defaultValues: defaultValuesFor(schema),
    mode: "onTouched",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>FormBuilder (task 10)</CardTitle>
        <CardDescription>
          Schema JSON → React Hook Form + Zod. Chọn{" "}
          <code>Có anh/chị đang học tại trường? = Có</code> để hiện field điều
          kiện. Field ẩn không chặn submit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              toast.success("Submit hợp lệ", {
                description: JSON.stringify(values),
              });
            })}
            className="space-y-6"
          >
            <FormBuilder schema={schema} control={form.control} />
            <Button type="submit">Gửi thử</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
