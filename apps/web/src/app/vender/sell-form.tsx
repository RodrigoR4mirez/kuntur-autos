'use client';

import { useEffect, useState, type FormEvent } from 'react';

interface Option {
  id: number;
  name: string;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export function SellForm() {
  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [bodyTypes, setBodyTypes] = useState<Option[]>([]);
  const [colors, setColors] = useState<Option[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getJson<{ brands: Option[] }>('/api/catalog/brands').then((d) =>
      setBrands(d?.brands ?? []),
    );
    void getJson<{ bodyTypes: Option[]; colors: Option[] }>('/api/catalog/options').then((d) => {
      setBodyTypes(d?.bodyTypes ?? []);
      setColors(d?.colors ?? []);
    });
  }, []);

  async function onBrand(id: string) {
    setModels([]);
    if (!id) return;
    const d = await getJson<{ models: Option[] }>(`/api/catalog/brands/${id}/models`);
    setModels(d?.models ?? []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const n = (k: string) => Number(f.get(k));
    const s = (k: string) => String(f.get(k) ?? '').trim();
    setBusy(true);
    setMessage(null);
    try {
      const created = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: s('title'),
          price: { amountMinor: Math.round(n('price') * 100), currency: s('currency') },
          department: s('department'),
          city: s('city'),
          vehicle: {
            brandId: n('brandId'),
            modelId: n('modelId'),
            versionId: null,
            bodyTypeId: n('bodyTypeId'),
            colorId: n('colorId'),
            year: n('year'),
            mileageKm: n('mileageKm'),
            transmission: s('transmission'),
            fuel: s('fuel'),
            plate: s('plate'),
          },
        }),
      });
      const body = (await created.json()) as { id?: string; error?: { message?: string } };
      if (!created.ok || !body.id) {
        setMessage({ ok: false, text: body.error?.message ?? 'No pudimos crear el anuncio.' });
        return;
      }
      const submitted = await fetch(`/api/listings/${body.id}/submit`, { method: 'POST' });
      if (!submitted.ok) {
        setMessage({
          ok: false,
          text: 'Se guardó el borrador, pero no pudimos enviarlo a revisión.',
        });
        return;
      }
      window.location.href = `/anuncios/${body.id}`;
    } catch {
      setMessage({ ok: false, text: 'Sin conexión con el servicio. Inténtalo de nuevo.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        Título
        <input
          name="title"
          required
          minLength={5}
          maxLength={100}
          placeholder="Toyota Yaris 2019 en excelente estado"
        />
      </label>
      <div className="row">
        <label>
          Marca
          <select
            name="brandId"
            required
            onChange={(e) => void onBrand(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Elige
            </option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Modelo
          <select name="modelId" required defaultValue="">
            <option value="" disabled>
              Elige
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <label>
          Carrocería
          <select name="bodyTypeId" required defaultValue="">
            <option value="" disabled>
              Elige
            </option>
            {bodyTypes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Color
          <select name="colorId" required defaultValue="">
            <option value="" disabled>
              Elige
            </option>
            {colors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="row">
        <label>
          Año
          <input name="year" type="number" required min={1980} max={new Date().getFullYear() + 1} />
        </label>
        <label>
          Kilometraje
          <input name="mileageKm" type="number" required min={0} />
        </label>
      </div>
      <div className="row">
        <label>
          Transmisión
          <select name="transmission" required defaultValue="manual">
            <option value="manual">Manual</option>
            <option value="automatic">Automática</option>
          </select>
        </label>
        <label>
          Combustible
          <select name="fuel" required defaultValue="gasoline">
            <option value="gasoline">Gasolina</option>
            <option value="diesel">Diésel</option>
            <option value="lpg">GLP</option>
            <option value="gnv">GNV</option>
            <option value="hybrid">Híbrido</option>
            <option value="electric">Eléctrico</option>
          </select>
        </label>
      </div>
      <label>
        Placa
        <input
          name="plate"
          required
          minLength={6}
          maxLength={7}
          placeholder="ABC123"
          className="mono"
        />
      </label>
      <div className="row">
        <label>
          Precio
          <input name="price" type="number" required min={1} step="0.01" />
        </label>
        <label>
          Moneda
          <select name="currency" defaultValue="PEN">
            <option value="PEN">S/ (soles)</option>
            <option value="USD">US$ (dólares)</option>
          </select>
        </label>
      </div>
      <div className="row">
        <label>
          Departamento
          <input name="department" required defaultValue="Lima" />
        </label>
        <label>
          Ciudad
          <input name="city" required />
        </label>
      </div>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar a revisión'}
      </button>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'ok' : 'error'}>
          {message.text}
        </p>
      )}
    </form>
  );
}
