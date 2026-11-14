// Cloudflare Worker entry: Astro + EmDash request handling plus the Cron Trigger
// that runs scheduled publishing and EmDash maintenance.
import handler, {
  createScheduledHandler,
  EmDashRoom,
  EmDashRoomSite,
  PluginBridge,
} from "@emdash-cms/cloudflare/worker";

export { EmDashRoom, EmDashRoomSite, PluginBridge };

export default {
  ...handler,
  scheduled: createScheduledHandler(),
};
