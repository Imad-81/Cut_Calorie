import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const headerPayload = request.headers;

    try {
      const result = await ctx.runAction((internal as any).clerk.handleClerkWebhook, {
        payload: payloadString,
        headers: {
          svixId: headerPayload.get("svix-id")!,
          svixTimestamp: headerPayload.get("svix-timestamp")!,
          svixSignature: headerPayload.get("svix-signature")!,
        },
      });

      return new Response(null, {
        status: 200,
      });
    } catch (err) {
      console.error("Webhook Error:", err);
      return new Response("Webhook Error", {
        status: 400,
      });
    }
  }),
});

export default http;
