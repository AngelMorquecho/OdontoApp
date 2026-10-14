create extension if not exists pgcrypto;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre_completo text not null,
  rol text not null check (rol in ('SUPER_ADMIN', 'DOCTOR', 'PACIENTE')),
  doctor_id uuid references public.perfiles(id) on delete restrict,
  paciente_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (rol = 'DOCTOR' and (doctor_id is null or doctor_id = id) and paciente_id is null)
    or (rol = 'PACIENTE' and doctor_id is null)
    or (rol = 'SUPER_ADMIN' and doctor_id is null and paciente_id is null)
  )
);

create table if not exists public.doctores (
  id uuid primary key references public.perfiles(id) on delete cascade,
  email text not null unique,
  especialidad text not null default '',
  cedula text not null default '',
  suscripcion text not null default 'activa' check (suscripcion in ('activa', 'inactiva')),
  limite_pacientes integer check (limite_pacientes is null or limite_pacientes > 0),
  fecha_vencimiento date not null default (current_date + interval '1 year')::date,
  fecha_alta date not null default current_date
);

create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctores(id) on delete restrict,
  nombre text not null,
  edad integer not null check (edad >= 0),
  telefono text not null default '',
  fecha_nacimiento date,
  correo text,
  odontograma jsonb not null default '{}'::jsonb,
  radiografias jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.perfiles
  add constraint perfiles_paciente_id_fkey
  foreign key (paciente_id) references public.pacientes(id) on delete set null;

create table if not exists public.historias_clinicas (
  paciente_id uuid primary key references public.pacientes(id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.citas (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctores(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  fecha date not null,
  hora time not null,
  motivo_consulta text not null default '',
  tratamiento_previsto text not null default '',
  estatus text not null check (estatus in ('programada', 'confirmada', 'pospuesta', 'completada', 'cancelada')),
  notas_agenda text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notas_evolucion (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctores(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  fecha date not null,
  hora time not null,
  region_od text not null default '',
  evolucion_procedimiento text not null,
  diagnostico text not null,
  pronostico text not null check (pronostico in ('Favorable', 'Reservado', 'Desfavorable')),
  plan text not null,
  anestesia text not null check (anestesia in ('si', 'no')),
  estudios jsonb not null default '{}'::jsonb,
  receta text not null default '',
  indicaciones text not null default '',
  proxima_cita date,
  tratante text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recetas (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctores(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  fecha_emision date not null default current_date,
  diagnostico text not null default '',
  medicamentos jsonb not null default '[]'::jsonb,
  indicaciones_generales text not null default '',
  estado_tratamiento text not null check (estado_tratamiento in ('activo', 'completado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tratamientos (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctores(id) on delete restrict,
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  nombre text not null,
  descripcion text not null default '',
  costo_total numeric(12, 2) not null check (costo_total > 0),
  estado text not null check (estado in ('en_proceso', 'completado')),
  fecha_creacion date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.abonos (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctores(id) on delete restrict,
  tratamiento_id uuid not null references public.tratamientos(id) on delete cascade,
  monto numeric(12, 2) not null check (monto > 0),
  fecha date not null default current_date,
  metodo_pago text not null check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia')),
  concepto text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.consultorios (
  doctor_id uuid primary key references public.doctores(id) on delete cascade,
  nombre_doctor text not null,
  cedula text not null default '',
  direccion text not null default '',
  telefono text not null default '',
  nombre_clinica text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists pacientes_doctor_id_idx on public.pacientes(doctor_id);
create index if not exists citas_doctor_fecha_idx on public.citas(doctor_id, fecha, hora);
create index if not exists citas_paciente_fecha_idx on public.citas(paciente_id, fecha);
create index if not exists notas_paciente_fecha_idx on public.notas_evolucion(paciente_id, fecha desc);
create index if not exists recetas_paciente_fecha_idx on public.recetas(paciente_id, fecha_emision desc);
create index if not exists tratamientos_paciente_fecha_idx on public.tratamientos(paciente_id, fecha_creacion desc);
create index if not exists abonos_tratamiento_fecha_idx on public.abonos(tratamiento_id, fecha desc);

create or replace function public.app_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = (select auth.uid())
$$;

create or replace function public.app_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.rol = 'DOCTOR' then p.id
    when p.rol = 'PACIENTE' then (select doctor_id from public.pacientes where id = p.paciente_id)
    else null
  end
  from public.perfiles p
  where p.id = (select auth.uid())
$$;

create or replace function public.app_paciente_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select paciente_id from public.perfiles where id = (select auth.uid()) and rol = 'PACIENTE'
$$;

create or replace function public.puede_ver_paciente(paciente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select paciente = public.app_paciente_id()
    or exists (
      select 1 from public.pacientes p
      where p.id = paciente and p.doctor_id = public.app_doctor_id()
    )
$$;

revoke all on function public.app_rol() from public, anon;
revoke all on function public.app_doctor_id() from public, anon;
revoke all on function public.app_paciente_id() from public, anon;
revoke all on function public.puede_ver_paciente(uuid) from public, anon;
grant execute on function public.app_rol() to authenticated;
grant execute on function public.app_doctor_id() to authenticated;
grant execute on function public.app_paciente_id() to authenticated;
grant execute on function public.puede_ver_paciente(uuid) to authenticated;

create or replace function public.asignar_doctor_del_paciente()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_doctor_id uuid;
begin
  select doctor_id into v_doctor_id
  from public.pacientes
  where id = new.paciente_id;
  if not found then
    raise exception 'No se encontró el paciente del registro.';
  end if;
  if new.doctor_id is not null and new.doctor_id <> v_doctor_id then
    raise exception 'El paciente pertenece a otra cuenta de doctor.';
  end if;
  new.doctor_id := v_doctor_id;
  return new;
end;
$$;

create or replace function public.asignar_doctor_del_tratamiento()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_doctor_id uuid;
begin
  select doctor_id into v_doctor_id
  from public.tratamientos
  where id = new.tratamiento_id;
  if not found then
    raise exception 'No se encontró el tratamiento del abono.';
  end if;
  if new.doctor_id is not null and new.doctor_id <> v_doctor_id then
    raise exception 'El tratamiento pertenece a otra cuenta de doctor.';
  end if;
  new.doctor_id := v_doctor_id;
  return new;
end;
$$;

create trigger abonos_asignar_doctor
  before insert on public.abonos
  for each row execute function public.asignar_doctor_del_tratamiento();

create trigger citas_asignar_doctor
  before insert on public.citas
  for each row execute function public.asignar_doctor_del_paciente();
create trigger notas_asignar_doctor
  before insert on public.notas_evolucion
  for each row execute function public.asignar_doctor_del_paciente();
create trigger recetas_asignar_doctor
  before insert on public.recetas
  for each row execute function public.asignar_doctor_del_paciente();
create trigger tratamientos_asignar_doctor
  before insert on public.tratamientos
  for each row execute function public.asignar_doctor_del_paciente();

create or replace function public.validar_limite_pacientes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_limite integer;
  v_suscripcion text;
  v_vencimiento date;
  v_actuales bigint;
begin
  select limite_pacientes, suscripcion, fecha_vencimiento
    into v_limite, v_suscripcion, v_vencimiento
  from public.doctores
  where id = new.doctor_id
  for update;
  if not found or v_suscripcion <> 'activa' or v_vencimiento < current_date then
    raise exception 'La licencia del doctor está inactiva o vencida.';
  end if;
  select count(*) into v_actuales from public.pacientes where doctor_id = new.doctor_id;
  if v_limite is not null and v_actuales >= v_limite then
    raise exception 'Se alcanzó el límite de pacientes permitido para esta licencia.';
  end if;
  return new;
end;
$$;

create trigger pacientes_validar_licencia_y_limite
  before insert on public.pacientes
  for each row execute function public.validar_limite_pacientes();

create or replace function public.validar_saldo_tratamiento()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_costo numeric(12, 2);
  v_pagado numeric(12, 2);
begin
  select costo_total into v_costo
  from public.tratamientos
  where id = new.tratamiento_id
  for update;
  select coalesce(sum(monto), 0) into v_pagado
  from public.abonos
  where tratamiento_id = new.tratamiento_id
    and (tg_op = 'INSERT' or id <> new.id);
  if v_pagado + new.monto > v_costo then
    raise exception 'El abono supera el saldo pendiente del tratamiento.';
  end if;
  return new;
end;
$$;

create trigger abonos_validar_saldo
  before insert or update on public.abonos
  for each row execute function public.validar_saldo_tratamiento();

create or replace function public.validar_costo_tratamiento()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pagado numeric(12, 2);
begin
  if new.costo_total < old.costo_total then
    select coalesce(sum(monto), 0) into v_pagado
    from public.abonos where tratamiento_id = old.id;
    if new.costo_total < v_pagado then
      raise exception 'El costo no puede ser menor que el total de abonos registrados.';
    end if;
  end if;
  return new;
end;
$$;

create trigger tratamientos_validar_abonos
  before update of costo_total on public.tratamientos
  for each row execute function public.validar_costo_tratamiento();

grant execute on function public.app_rol(), public.app_doctor_id(), public.app_paciente_id(), public.puede_ver_paciente(uuid) to authenticated;
grant select on public.doctores, public.pacientes, public.historias_clinicas,
  public.citas, public.notas_evolucion, public.recetas, public.tratamientos,
  public.abonos, public.consultorios to authenticated;
grant insert, update, delete on public.doctores to authenticated;
grant insert on public.pacientes to authenticated;
revoke update on public.pacientes from authenticated;
grant update (nombre, edad, telefono, fecha_nacimiento, correo, odontograma, radiografias)
  on public.pacientes to authenticated;
grant delete on public.pacientes to authenticated;
grant insert, update, delete on public.historias_clinicas to authenticated;
grant insert, delete on public.citas to authenticated;
grant insert, update, delete on public.notas_evolucion to authenticated;
revoke update on public.notas_evolucion from authenticated;
grant update (fecha, hora, region_od, evolucion_procedimiento, diagnostico, pronostico,
  plan, anestesia, estudios, receta, indicaciones, proxima_cita, tratante)
  on public.notas_evolucion to authenticated;
grant insert, update, delete on public.recetas to authenticated;
revoke update on public.recetas from authenticated;
grant update (fecha_emision, diagnostico, medicamentos, indicaciones_generales, estado_tratamiento)
  on public.recetas to authenticated;
grant insert, update, delete on public.tratamientos to authenticated;
revoke update on public.tratamientos from authenticated;
grant update (nombre, descripcion, costo_total, estado) on public.tratamientos to authenticated;
grant insert, update, delete on public.abonos to authenticated;
revoke update on public.abonos from authenticated;
grant update (monto, fecha, metodo_pago, concepto) on public.abonos to authenticated;
grant insert, update, delete on public.consultorios to authenticated;
revoke update on public.consultorios from authenticated;
grant update (nombre_doctor, cedula, direccion, telefono, nombre_clinica)
  on public.consultorios to authenticated;

alter table public.perfiles enable row level security;
alter table public.doctores enable row level security;
alter table public.pacientes enable row level security;
alter table public.historias_clinicas enable row level security;
alter table public.citas enable row level security;
alter table public.notas_evolucion enable row level security;
alter table public.recetas enable row level security;
alter table public.tratamientos enable row level security;
alter table public.abonos enable row level security;
alter table public.consultorios enable row level security;

create policy perfiles_select_self_or_admin on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or public.app_rol() = 'SUPER_ADMIN');
create policy perfiles_admin_insert on public.perfiles for insert to authenticated
  with check (public.app_rol() = 'SUPER_ADMIN');
create policy perfiles_admin_update on public.perfiles for update to authenticated
  using (public.app_rol() = 'SUPER_ADMIN')
  with check (public.app_rol() = 'SUPER_ADMIN');
grant select on public.perfiles to authenticated;
grant insert (id, email, nombre_completo, rol, doctor_id, paciente_id) on public.perfiles to authenticated;
revoke update on public.perfiles from authenticated;
grant update (nombre_completo, rol, doctor_id, paciente_id) on public.perfiles to authenticated;

create policy doctores_select_owner_or_admin on public.doctores for select to authenticated
  using (id = public.app_doctor_id() or public.app_rol() = 'SUPER_ADMIN');
create policy doctores_admin_insert on public.doctores for insert to authenticated
  with check (public.app_rol() = 'SUPER_ADMIN');
create policy doctores_admin_update on public.doctores for update to authenticated
  using (public.app_rol() = 'SUPER_ADMIN')
  with check (public.app_rol() = 'SUPER_ADMIN');
create policy doctores_admin_delete on public.doctores for delete to authenticated
  using (public.app_rol() = 'SUPER_ADMIN');

create policy pacientes_select_authorized on public.pacientes for select to authenticated
  using (public.puede_ver_paciente(id));
create policy pacientes_insert_doctor on public.pacientes for insert to authenticated
  with check (doctor_id = public.app_doctor_id() and public.app_rol() = 'DOCTOR');
create policy pacientes_update_doctor on public.pacientes for update to authenticated
  using (doctor_id = public.app_doctor_id() and public.app_rol() = 'DOCTOR')
  with check (doctor_id = public.app_doctor_id() and public.app_rol() = 'DOCTOR');
create policy pacientes_delete_doctor on public.pacientes for delete to authenticated
  using (doctor_id = public.app_doctor_id() and public.app_rol() = 'DOCTOR');

create policy historias_select_authorized on public.historias_clinicas for select to authenticated
  using (public.puede_ver_paciente(paciente_id));
create policy historias_manage_doctor on public.historias_clinicas for all to authenticated
  using (public.app_rol() = 'DOCTOR' and exists (
    select 1 from public.pacientes p where p.id = paciente_id and p.doctor_id = public.app_doctor_id()
  ))
  with check (public.app_rol() = 'DOCTOR' and exists (
    select 1 from public.pacientes p where p.id = paciente_id and p.doctor_id = public.app_doctor_id()
  ));

create policy citas_select_authorized on public.citas for select to authenticated
  using (public.puede_ver_paciente(paciente_id));
create policy citas_insert_doctor on public.citas for insert to authenticated
  with check (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and public.puede_ver_paciente(paciente_id));
create policy citas_update_authorized on public.citas for update to authenticated
  using (public.puede_ver_paciente(paciente_id))
  with check (public.puede_ver_paciente(paciente_id) and doctor_id = public.app_doctor_id());
create policy citas_confirmar_paciente on public.citas for update to authenticated
  using (paciente_id = public.app_paciente_id())
  with check (paciente_id = public.app_paciente_id() and estatus = 'confirmada');
revoke update on public.citas from authenticated;
grant update (estatus) on public.citas to authenticated;
create policy citas_delete_doctor on public.citas for delete to authenticated
  using (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id());

create policy notas_select_authorized on public.notas_evolucion for select to authenticated
  using (public.puede_ver_paciente(paciente_id));
create policy notas_manage_doctor on public.notas_evolucion for all to authenticated
  using (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and public.puede_ver_paciente(paciente_id))
  with check (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and public.puede_ver_paciente(paciente_id));

create policy recetas_select_authorized on public.recetas for select to authenticated
  using (public.puede_ver_paciente(paciente_id));
create policy recetas_manage_doctor on public.recetas for all to authenticated
  using (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and public.puede_ver_paciente(paciente_id))
  with check (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and public.puede_ver_paciente(paciente_id));

create policy tratamientos_select_authorized on public.tratamientos for select to authenticated
  using (public.puede_ver_paciente(paciente_id));
create policy tratamientos_manage_doctor on public.tratamientos for all to authenticated
  using (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and public.puede_ver_paciente(paciente_id))
  with check (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and public.puede_ver_paciente(paciente_id));

create policy abonos_select_authorized on public.abonos for select to authenticated
  using (exists (
    select 1 from public.tratamientos t
    where t.id = tratamiento_id and public.puede_ver_paciente(t.paciente_id)
  ));
create policy abonos_insert_doctor on public.abonos for insert to authenticated
  with check (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id()
    and exists (
      select 1 from public.tratamientos t
      where t.id = tratamiento_id and t.doctor_id = public.app_doctor_id()
    ));
create policy abonos_update_doctor on public.abonos for update to authenticated
  using (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id())
  with check (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id());
create policy abonos_delete_doctor on public.abonos for delete to authenticated
  using (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id());

create or replace function public.registrar_abono(
  p_tratamiento_id uuid,
  p_monto numeric,
  p_fecha date,
  p_metodo_pago text,
  p_concepto text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_costo numeric(12, 2);
  v_total numeric(12, 2);
  v_doctor_id uuid;
  v_abono_id uuid;
begin
  if public.app_rol() is distinct from 'DOCTOR' then
    raise exception 'Solo un doctor puede registrar abonos.';
  end if;
  select costo_total, doctor_id into v_costo, v_doctor_id
  from public.tratamientos
  where id = p_tratamiento_id
  for update;
  if not found or v_doctor_id <> public.app_doctor_id() then
    raise exception 'No se encontró el tratamiento o no pertenece a esta cuenta.';
  end if;
  select coalesce(sum(monto), 0) into v_total
  from public.abonos where tratamiento_id = p_tratamiento_id;
  if p_monto <= 0 or p_monto > v_costo - v_total then
    raise exception 'El abono debe ser positivo y no puede exceder el saldo pendiente.';
  end if;
  insert into public.abonos (tratamiento_id, monto, fecha, metodo_pago, concepto)
  values (p_tratamiento_id, p_monto, p_fecha, p_metodo_pago, coalesce(p_concepto, ''))
  returning id into v_abono_id;
  return v_abono_id;
end;
$$;
revoke all on function public.registrar_abono(uuid, numeric, date, text, text) from public, anon;
grant execute on function public.registrar_abono(uuid, numeric, date, text, text) to authenticated;

create policy consultorios_select_owner on public.consultorios for select to authenticated
  using (doctor_id = public.app_doctor_id() or public.app_rol() = 'SUPER_ADMIN');
create policy consultorios_manage_doctor on public.consultorios for all to authenticated
  using (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id())
  with check (public.app_rol() = 'DOCTOR' and doctor_id = public.app_doctor_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expedientes', 'expedientes', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy expedientes_select_authorized on storage.objects for select to authenticated
  using (bucket_id = 'expedientes' and (
    exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(name))[2]
        and (p.doctor_id::text = (storage.foldername(name))[1]
          and p.doctor_id = public.app_doctor_id()
          or p.id = public.app_paciente_id())
    )
  ));
create policy expedientes_insert_doctor on storage.objects for insert to authenticated
  with check (bucket_id = 'expedientes' and public.app_rol() = 'DOCTOR'
    and (storage.foldername(name))[1] = public.app_doctor_id()::text
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(name))[2]
        and p.doctor_id = public.app_doctor_id()
    ));
create policy expedientes_update_doctor on storage.objects for update to authenticated
  using (bucket_id = 'expedientes' and public.app_rol() = 'DOCTOR'
    and (storage.foldername(name))[1] = public.app_doctor_id()::text)
  with check (bucket_id = 'expedientes' and public.app_rol() = 'DOCTOR'
    and (storage.foldername(name))[1] = public.app_doctor_id()::text);
create policy expedientes_delete_doctor on storage.objects for delete to authenticated
  using (bucket_id = 'expedientes' and public.app_rol() = 'DOCTOR'
    and (storage.foldername(name))[1] = public.app_doctor_id()::text);
