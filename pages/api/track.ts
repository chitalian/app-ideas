// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import Mixpanel from "mixpanel";

const mixpanel = Mixpanel.init("8675b52befa27600f7b86adc8b937f8b");

interface Error {
  error: string;
}

interface Result {
  success: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Error | Result>
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let {
    details,
    event,
    user,
  }: { details: string; event: string; user: string } = req.body;
  mixpanel.track(event, { distinct_id: user, details: details }, (event) => {
    if (event) {
      console.log(event);
    }
  });

  res.status(200).json({ success: true });
}
