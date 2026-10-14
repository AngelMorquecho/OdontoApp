# Supabase production setup

1. Create a Supabase project and copy `.env.example` to `.env`. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the project's URL and publishable anon key. Never put a service-role key in the app.
2. Apply `migrations/20261014113000_initial_production_schema.sql` using the SQL Editor, or link the Supabase CLI with `supabase link --project-ref <project-ref>` and run `supabase db push`. It creates the application tables, row-level security policies, and the private `expedientes` storage bucket.
3. Create the first administrator through Supabase Auth. Then, in the SQL Editor, register that existing Auth user as the initial SuperAdmin, replacing the example email:

   ```sql
   insert into public.perfiles (id, email, nombre_completo, rol)
   select id, email, coalesce(raw_user_meta_data->>'nombre_completo', email), 'SUPER_ADMIN'
   from auth.users
   where email = 'admin@example.com'
   on conflict (id) do update
   set rol = 'SUPER_ADMIN';
   ```

4. Deploy the doctor-provisioning Edge Function:

   ```sh
   supabase functions deploy admin-create-doctor
   ```

   Supabase provides the service-role key to deployed functions. It must never be added to `.env` or shipped to the app.
5. Create patient Auth users through a trusted administrative process, then link each patient's profile to the corresponding `pacientes.id` and set its doctor owner. The patient portal is intentionally unavailable until that link exists.
6. Restart Expo after changing `.env`. Native iOS/Android auth sessions are chunked into encrypted SecureStore entries. Web uses browser local storage because SecureStore is a native-only module.

The migration and Edge Function are source-controlled, but require deployment to the target Supabase project. This repository cannot apply them to a remote project without project access. `supabase/config.toml` contains a local CLI project identifier; the deployed project's actual reference is supplied by `supabase link`.
