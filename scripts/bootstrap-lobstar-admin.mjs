import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail =
  process.env.LOBSTAR_ADMIN_EMAIL ??
  process.env.ADMIN_EMAILS?.split(",").map((item) => item.trim()).find(Boolean) ??
  "lobstar@klawfield.app";
const adminPassword = process.env.LOBSTAR_ADMIN_PASSWORD;
const xUsername = (process.env.LOBSTAR_X_USERNAME ?? "lobstar").toLowerCase();
const displayName = process.env.ADMIN_DISPLAY_NAME ?? "Lobstar";

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment.");
}
if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment.");
}
if (!adminPassword || adminPassword.length < 14 || !adminPassword.includes("$") || !adminPassword.includes("&")) {
  throw new Error("LOBSTAR_ADMIN_PASSWORD must be set, >=14 chars, and include both '$' and '&'.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      return found;
    }
    if (data.users.length < 200) {
      break;
    }
  }
  return null;
}

async function upsertProfile(userId) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: adminEmail,
      x_username: xUsername,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Failed to upsert profile: ${error.message}`);
  }
}

async function main() {
  const existing = await findUserByEmail(adminEmail);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        display_name: displayName,
      },
    });

    if (error) {
      throw new Error(`Failed to update existing admin user: ${error.message}`);
    }

    await upsertProfile(existing.id);
    console.log(`Updated admin user '${displayName}' (${adminEmail}).`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create admin user: ${error?.message ?? "Unknown error"}`);
    }

    await upsertProfile(data.user.id);
    console.log(`Created admin user '${displayName}' (${adminEmail}).`);
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(adminEmail.toLowerCase())) {
    console.warn("ADMIN_EMAILS does not include the Lobstar admin email. Add it before using admin routes.");
  }

  console.log("Lobstar admin bootstrap complete.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
