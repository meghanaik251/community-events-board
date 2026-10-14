import type { DatabaseSync } from "node:sqlite";
import { createAdmin } from "../src/server/auth";
import { createEvent, setEventActive } from "../src/server/events";
import type { Category } from "../src/lib/types";

const photos: Record<Category, string> = {
  Music: "photo-1516280440614-37939bbacd81",
  Workshop: "photo-1455390582262-044cdead277a",
  Food: "photo-1555939594-58d7cb561ad1",
  Sports: "photo-1530137073520-4ea6e2ee3bd0",
  Kids: "photo-1516627145497-ae6968895b74",
};
const samples: [string, Category, string, number, number, string, boolean?][] = [
  [
    "Under the stars: indie music night",
    "Music",
    "Coimbatore",
    1,
    350,
    "A little music, a little moonlight, and a room full of good people. Join local independent artists for an intimate open-air set. Bring a friend, find a cosy spot, and discover your next favourite song. Gates open 30 minutes before the show.",
  ],
  [
    "Clay, coffee & a little creativity",
    "Workshop",
    "Bengaluru",
    2,
    850,
    "Slow down and make something with your hands. Our beginner-friendly pottery session includes clay, tools, guidance, and a cup of fresh coffee. No experience needed; just bring your curiosity.",
  ],
  [
    "The neighbourhood food fair",
    "Food",
    "Chennai",
    3,
    0,
    "Meet the makers behind your favourite local flavours. Explore homemade treats, regional specialities, and small-batch bakes from community kitchens. Entry is free; food is available to purchase at each stall.",
  ],
  [
    "Sunday miles, shared smiles",
    "Sports",
    "Bengaluru",
    4,
    0,
    "An easy-paced community run through the park, followed by a relaxed stretch and conversation. Walkers and first-time runners are welcome. Bring water, comfortable shoes, and a little morning energy.",
  ],
  [
    "Little makers, big imaginations",
    "Kids",
    "Coimbatore",
    5,
    250,
    "A colourful afternoon of paper crafts, playful storytelling, and creative discoveries for children aged 5–10. Materials are included. A parent or guardian must stay for the session.",
  ],
  [
    "Jazz in the courtyard",
    "Music",
    "Hyderabad",
    6,
    500,
    "Spend an unhurried evening with a local jazz quartet. Expect warm melodies, familiar standards, and a few original surprises in a welcoming courtyard setting. Seating is first come, first served.",
  ],
  [
    "Make your first terrarium",
    "Workshop",
    "Chennai",
    7,
    1200,
    "Build a tiny green world to take home. Learn the basics of planting and caring for a terrarium with help from a local plant enthusiast. All plants, glass containers, and materials are included.",
  ],
  [
    "A taste of Coimbatore",
    "Food",
    "Coimbatore",
    8,
    450,
    "Share an evening of regional food and the stories behind it. Local home cooks will introduce a tasting menu inspired by family recipes. Please tell the host about allergies when you arrive.",
  ],
  [
    "Badminton & new beginnings",
    "Sports",
    "Hyderabad",
    9,
    200,
    "Friendly doubles, relaxed games, and new faces. This community badminton meetup welcomes all skill levels. Shuttlecocks are provided; bring your own racket and non-marking shoes.",
  ],
  [
    "Stories beneath the banyan",
    "Kids",
    "Bengaluru",
    10,
    0,
    "Gather for an interactive storytelling circle for children aged 4–8. Our storyteller brings folk tales to life with songs and simple games. Bring a mat; children must be accompanied by an adult.",
  ],
  [
    "Acoustic night at the garden",
    "Music",
    "Coimbatore",
    12,
    300,
    "Discover emerging singer-songwriters in a small garden setting. An evening of acoustic originals, shared stories, and quiet favourites. Light refreshments are available from the venue.",
  ],
  [
    "Sketch your city",
    "Workshop",
    "Hyderabad",
    11,
    600,
    "A guided urban sketching session for beginners. Explore simple drawing techniques and find beauty in familiar streets. Bring your sketchbook; pencils and guidance are provided.",
    false,
  ],
  [
    "Weekend bake exchange",
    "Food",
    "Chennai",
    14,
    150,
    "Meet fellow home bakers, trade recipes, and enjoy a shared tasting table. Label your bake with its ingredients so everyone can make informed choices. This event is currently being finalised.",
    false,
  ],
  [
    "Monsoon melodies",
    "Music",
    "Bengaluru",
    -2,
    400,
    "A past community concert featuring local musicians and original songs. This sample is retained for the admin to demonstrate that past events are automatically hidden from public listings.",
  ],
  [
    "Family park games",
    "Sports",
    "Coimbatore",
    -7,
    0,
    "A past afternoon of friendly outdoor games and neighbourhood conversations. This sample remains in the database and admin view to demonstrate event history without deletion.",
  ],
];
export async function seedDatabase(db: DatabaseSync) {
  await createAdmin(
    db,
    process.env.ADMIN_EMAIL || "admin@community.local",
    process.env.ADMIN_PASSWORD || "CommunityAdmin123!",
  );
  if (Number(db.prepare("SELECT COUNT(*) AS count FROM events").get()?.count) > 0) return false;
  for (const [title, category, city, day, rupees, description, active = true] of samples) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + day);
    date.setUTCHours(13, 0, 0, 0); // 6:30 PM IST
    const event = createEvent(db, {
      title,
      category,
      city,
      startsAt: date.toISOString(),
      pricePaise: rupees * 100,
      description,
      imageUrl: `https://images.unsplash.com/${photos[category]}?auto=format&fit=crop&w=1200&q=85`,
    });
    if (!active) setEventActive(db, event.id, false);
  }
  return true;
}
