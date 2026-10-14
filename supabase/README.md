# Supabase production setup

1. Create a Supabase project and copy `.env.example` to `.env`. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the project's URL and publishable anon key. Never put a service-role key in the app.
2. The checked-in initial migration describes an earlier schema (`perfiles.nombre_completo`, `perfiles.doctor_id`, and `abonos`) and does not match the production schema used by the frontend (`perfiles.nombre` and `pagos_abonos`). Do not apply it to a project using the production schema; apply the SQL migrations maintained for that project instead.
3. Create the first administrator through Supabase Auth. Then, in the SQL Editor, register that existing Auth user as the initial SuperAdmin, replacing the example email:

   ```sql
   insert into public.perfiles (id, email, nombre, rol)
   select id, email, coalesce(raw_user_meta_data->>'nombre', email), 'SUPER_ADMIN'
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
5. Create patient Auth users through a trusted administrative process. The frontend currently maps `perfiles.id` to the patient ID, so the patient's `pacientes.id` must match the Auth user/profile UUID for the patient portal to resolve its record.
6. Restart Expo after changing `.env`. Native iOS/Android auth sessions are chunked into encrypted SecureStore entries. Web uses browser local storage because SecureStore is a native-only module.

The Edge Function is source-controlled but requires deployment to the target Supabase project. This repository cannot apply it to a remote project without project access. `supabase/config.toml` contains a local CLI project identifier; the deployed project's actual reference is supplied by `supabase link`.
