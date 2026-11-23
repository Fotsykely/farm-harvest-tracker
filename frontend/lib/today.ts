import { connection } from "next/server";

// The current date, read at request time. With Cache Components, `new Date()` is refused while a page is
// prerendered (the value would be frozen in the static shell); `connection()` marks the rest of the render
// as request-time. Always call this from a component inside <Suspense>.
export async function currentDate(): Promise<Date> {
  await connection();
  return new Date();
}
