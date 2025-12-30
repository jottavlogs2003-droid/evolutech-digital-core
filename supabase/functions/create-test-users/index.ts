import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get company IDs
    const { data: companies } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .order("name");

    if (!companies || companies.length === 0) {
      throw new Error("No companies found. Please create companies first.");
    }

    const empresaAlpha = companies.find(c => c.name.includes("Alpha"));
    
    if (!empresaAlpha) {
      throw new Error("Empresa Alpha not found");
    }

    const testUsers = [
      {
        email: "superadmin@evolutech.com",
        password: "123456",
        full_name: "Super Admin Evolutech",
        role: "super_admin_evolutech" as const,
        company_id: null,
      },
      {
        email: "admin@evolutech.com",
        password: "123456",
        full_name: "Admin Evolutech",
        role: "admin_evolutech" as const,
        company_id: null,
      },
      {
        email: "dono@alpha.com",
        password: "123456",
        full_name: "João Silva (Dono Alpha)",
        role: "dono_empresa" as const,
        company_id: empresaAlpha.id,
      },
      {
        email: "funcionario@alpha.com",
        password: "123456",
        full_name: "Maria Santos (Funcionária)",
        role: "funcionario_empresa" as const,
        company_id: empresaAlpha.id,
      },
    ];

    const results = [];

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);

      let userId: string;

      if (existingUser) {
        // Update existing user password
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: user.password,
          email_confirm: true,
        });
        userId = existingUser.id;
        results.push({ email: user.email, status: "updated", userId });
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (createError) {
          results.push({ email: user.email, status: "error", error: createError.message });
          continue;
        }

        userId = newUser.user.id;
        results.push({ email: user.email, status: "created", userId });
      }

      // Update profile
      await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          email: user.email,
          full_name: user.full_name,
        });

      // Delete existing roles for this user
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Assign role
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: user.role,
        company_id: user.company_id,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test users created successfully",
        results,
        testCredentials: testUsers.map(u => ({ 
          email: u.email, 
          password: u.password, 
          role: u.role 
        }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
