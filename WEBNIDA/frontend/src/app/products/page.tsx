"use client";
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/Product/ProductCard";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import SearchSuggest from "@/components/Product/SearchSuggest";
import { toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search as SearchIcon, Tag, DollarSign, Star, CheckCircle } from "lucide-react";

type Categoria = { id: number; nombre: string };
type Producto = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  destacado?: boolean;
  imagen?: string | null;
  categoria_id?: number;
  categoria_nombre?: string | null;
};

type Paginacion = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

const normalizeCategorias = (payload: unknown): Categoria[] => {
  if (Array.isArray(payload)) return payload as Categoria[];
  if (payload && typeof payload === "object") {
    const record = payload as {
      categorias?: unknown;
      data?: unknown;
    };

    if (Array.isArray(record.categorias)) return record.categorias as Categoria[];
    if (Array.isArray(record.data)) return record.data as Categoria[];

    if (record.data && typeof record.data === "object") {
      const nested = record.data as { categorias?: unknown };
      if (Array.isArray(nested.categorias)) return nested.categorias as Categoria[];
    }
  }

  return [];
};

const deriveCategoriasFromProductos = (items: Producto[]): Categoria[] => {
  const map = new Map<number, Categoria>();

  for (const item of items) {
    const id = Number(item.categoria_id);
    const nombre = String(item.categoria_nombre ?? "").trim();

    if (Number.isFinite(id) && id > 0 && nombre) {
      map.set(id, { id, nombre });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

function ProductsPageContent() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filtros, setFiltros] = useState({
    busqueda: "",
    categoria: "",
    disponible: true,
    destacado: false,
    precioMin: "",
    precioMax: "",
  });
  const [paginacion, setPaginacion] = useState<Paginacion>({
    pagina: 1,
    limite: 12,
    total: 0,
    totalPaginas: 0,
  });
  const [ordenamiento, setOrdenamiento] = useState<string>("nombre");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);

  useEffect(() => {
    try {
      const q = searchParams.get("buscar") ?? "";
      const cat = searchParams.get("categoria") ?? "";
      const disp = searchParams.get("disponible");
      const dest = searchParams.get("destacado");
      const min = searchParams.get("precioMin") ?? "";
      const max = searchParams.get("precioMax") ?? "";
      const ord = searchParams.get("orden") ?? "nombre";
      const page = parseInt(searchParams.get("pagina") ?? "1", 10);
      const limit = parseInt(searchParams.get("limite") ?? "12", 10);

      setFiltros({
        busqueda: q,
        categoria: cat,
        disponible: disp === "0" ? false : true,
        destacado: dest === "1",
        precioMin: min,
        precioMax: max,
      });
      setOrdenamiento(ord);
      setPaginacion((prev) => ({
        ...prev,
        pagina: Number.isFinite(page) && page > 0 ? page : 1,
        limite: Number.isFinite(limit) && limit > 0 ? limit : prev.limite,
      }));
    } catch {
      // no-op
    }
    setInitializedFromQuery(true);
  }, [searchParams]);

  const syncQueryToUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filtros.busqueda) params.set("buscar", filtros.busqueda);
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (!filtros.disponible) params.set("disponible", "0");
    if (filtros.destacado) params.set("destacado", "1");
    if (filtros.precioMin) params.set("precioMin", filtros.precioMin);
    if (filtros.precioMax) params.set("precioMax", filtros.precioMax);
    if (ordenamiento) params.set("orden", ordenamiento);
    if (paginacion.pagina > 1) params.set("pagina", String(paginacion.pagina));
    if (paginacion.limite !== 12) params.set("limite", String(paginacion.limite));

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, filtros, ordenamiento, paginacion.pagina, paginacion.limite]);

  useEffect(() => {
    if (!initializedFromQuery) return;
    syncQueryToUrl();
  }, [initializedFromQuery, syncQueryToUrl]);

  const { addToCart, isInCart, getCartItem, canAddToCart, openCart } = useCart();

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await axios.get("/api/categorias");
      setCategorias(normalizeCategorias(res.data));
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setCategorias([]);
    }
  }, []);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pagina: String(paginacion.pagina),
        limite: String(paginacion.limite),
      });

      if (filtros.busqueda) params.set("buscar", filtros.busqueda);
      if (filtros.categoria) params.set("categoria", filtros.categoria);

      const res = await axios.get(`/api/productos?${params.toString()}`);
      let items: Producto[] = res.data.productos || [];

      if (filtros.disponible) {
        items = items.filter((p) => (p.stock ?? 0) > 0);
      }

      const min = parseFloat(filtros.precioMin);
      const max = parseFloat(filtros.precioMax);
      const hasMin = filtros.precioMin !== "" && !Number.isNaN(min);
      const hasMax = filtros.precioMax !== "" && !Number.isNaN(max);

      if (hasMin) items = items.filter((p) => p.precio >= min);
      if (hasMax) items = items.filter((p) => p.precio <= max);

      if (filtros.destacado) items = items.filter((p) => !!p.destacado);

      items = items.slice();

      if (ordenamiento === "nombre") {
        items.sort((a, b) => a.nombre.localeCompare(b.nombre));
      } else if (ordenamiento === "precio_asc") {
        items.sort((a, b) => a.precio - b.precio);
      } else if (ordenamiento === "precio_desc") {
        items.sort((a, b) => b.precio - a.precio);
      } else if (ordenamiento === "destacado") {
        items.sort(
          (a, b) => Number(!!b.destacado) - Number(!!a.destacado) || a.nombre.localeCompare(b.nombre)
        );
      }

      setProductos(items);
      setCategorias((prev) => {
        if (prev.length > 0) return prev;
        return deriveCategoriasFromProductos(items);
      });
      setPaginacion((prev) => ({
        ...prev,
        total: res.data.pagination?.total ?? items.length,
        totalPaginas: res.data.pagination?.totalPaginas ?? Math.max(1, Math.ceil(items.length / prev.limite)),
      }));
      setError("");
    } catch (err) {
      console.error("Error cargando productos públicos:", err);
      setError("Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  }, [
    paginacion.pagina,
    paginacion.limite,
    filtros.busqueda,
    filtros.categoria,
    filtros.disponible,
    filtros.destacado,
    filtros.precioMin,
    filtros.precioMax,
    ordenamiento,
  ]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleFiltroChange = (campo: keyof typeof filtros, valor: string | boolean) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPaginacion((prev) => ({ ...prev, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      categoria: "",
      disponible: true,
      destacado: false,
      precioMin: "",
      precioMax: "",
    });
    setPaginacion((prev) => ({ ...prev, pagina: 1 }));
    router.replace(pathname);
  };

  const handleOrdenamientoChange = (nuevoOrden: string) => {
    setOrdenamiento(nuevoOrden);
    setPaginacion((prev) => ({ ...prev, pagina: 1 }));
  };

  const handlePaginaChange = (nuevaPagina: number) => {
    setPaginacion((prev) => ({ ...prev, pagina: nuevaPagina }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimiteChange = (nuevoLimite: number) => {
    setPaginacion((prev) => ({ ...prev, limite: nuevoLimite, pagina: 1 }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paginacionItems = useMemo(() => {
    const items: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, paginacion.pagina - Math.floor(maxVisible / 2));
    const endPage = Math.min(paginacion.totalPaginas, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page++) items.push(page);

    return { items, startPage, endPage };
  }, [paginacion.pagina, paginacion.totalPaginas]);

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-6">
        <aside>
          <div className="theme-surface-strong h-fit rounded-2xl border p-4 shadow-sm md:sticky md:top-24">
            <h5 className="text-lg font-semibold mb-3 inline-flex items-center gap-2">
              <Filter size={16} /> Filtros
            </h5>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 inline-flex items-center gap-2" htmlFor="buscar">
                <SearchIcon size={14} className="text-[var(--color-muted)]" /> Buscar productos
              </label>
              <SearchSuggest
                value={filtros.busqueda}
                onChange={(v) => handleFiltroChange("busqueda", v)}
                onSelect={(s) => {
                  handleFiltroChange("busqueda", s.nombre);
                }}
                placeholder="Nombre del producto..."
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 inline-flex items-center gap-2" htmlFor="categoria">
                <Tag size={14} className="text-[var(--color-muted)]" /> Categoría
              </label>
              <select
                id="categoria"
                className="theme-input w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-secondary)]"
                value={filtros.categoria}
                onChange={(e) => handleFiltroChange("categoria", e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <input
                id="solo-disponibles"
                type="checkbox"
                className="h-4 w-4 rounded border border-[var(--border-strong)]"
                checked={filtros.disponible}
                onChange={(e) => handleFiltroChange("disponible", e.target.checked)}
              />
              <label className="text-sm inline-flex items-center gap-2" htmlFor="solo-disponibles">
                <CheckCircle size={14} className="text-[var(--color-muted)]" /> Solo productos disponibles
              </label>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 inline-flex items-center gap-2" htmlFor="precioMin">
                  <DollarSign size={14} className="text-[var(--color-muted)]" /> Precio mínimo
                </label>
                <input
                  id="precioMin"
                  type="number"
                  min="0"
                  step="0.01"
                  className="theme-input w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-secondary)]"
                  value={filtros.precioMin}
                  onChange={(e) => handleFiltroChange("precioMin", e.target.value)}
                  placeholder="S/ 0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 inline-flex items-center gap-2" htmlFor="precioMax">
                  <DollarSign size={14} className="text-[var(--color-muted)]" /> Precio máximo
                </label>
                <input
                  id="precioMax"
                  type="number"
                  min="0"
                  step="0.01"
                  className="theme-input w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-secondary)]"
                  value={filtros.precioMax}
                  onChange={(e) => handleFiltroChange("precioMax", e.target.value)}
                  placeholder="S/ 100.00"
                />
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <input
                id="solo-destacados"
                type="checkbox"
                className="h-4 w-4 rounded border border-[var(--border-strong)]"
                checked={filtros.destacado}
                onChange={(e) => handleFiltroChange("destacado", e.target.checked)}
              />
              <label className="text-sm inline-flex items-center gap-2" htmlFor="solo-destacados">
                <Star size={14} className="text-[var(--color-muted)]" /> Solo destacados
              </label>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        </aside>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Nuestros Productos</h1>
              <p className="text-[var(--color-muted)]">{paginacion.total} productos encontrados</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="theme-input rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-secondary)]"
                value={ordenamiento}
                onChange={(e) => handleOrdenamientoChange(e.target.value)}
              >
                <option value="nombre">Ordenar por nombre</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="destacado">Destacados primero</option>
              </select>

              <select
                className="theme-input rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-secondary)]"
                value={paginacion.limite}
                onChange={(e) => handleLimiteChange(Number(e.target.value))}
              >
                <option value={12}>12 por página</option>
                <option value={24}>24 por página</option>
                <option value={36}>36 por página</option>
              </select>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {filtros.busqueda && (
              <button
                className="theme-surface-strong theme-hover rounded-full border px-2.5 py-1 text-sm transition-colors"
                onClick={() => handleFiltroChange("busqueda", "")}
                title="Quitar búsqueda"
              >
                Buscar: {filtros.busqueda} ×
              </button>
            )}

            {filtros.categoria && (
              <button
                className="theme-surface-strong theme-hover rounded-full border px-2.5 py-1 text-sm transition-colors"
                onClick={() => handleFiltroChange("categoria", "")}
                title="Quitar categoría"
              >
                Categoría: {categorias.find((c) => String(c.id) === filtros.categoria)?.nombre || filtros.categoria} ×
              </button>
            )}

            {filtros.precioMin && (
              <button
                className="theme-surface-strong theme-hover rounded-full border px-2.5 py-1 text-sm transition-colors"
                onClick={() => handleFiltroChange("precioMin", "")}
                title="Quitar precio mínimo"
              >
                Mín: S/ {filtros.precioMin} ×
              </button>
            )}

            {filtros.precioMax && (
              <button
                className="theme-surface-strong theme-hover rounded-full border px-2.5 py-1 text-sm transition-colors"
                onClick={() => handleFiltroChange("precioMax", "")}
                title="Quitar precio máximo"
              >
                Máx: S/ {filtros.precioMax} ×
              </button>
            )}

            {filtros.destacado && (
              <button
                className="theme-surface-strong theme-hover rounded-full border px-2.5 py-1 text-sm transition-colors"
                onClick={() => handleFiltroChange("destacado", false)}
                title="Quitar filtro destacados"
              >
                Solo destacados ×
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="theme-surface-strong overflow-hidden rounded-2xl border shadow-sm">
                  <Skeleton className="aspect-square" rounded="xl" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full" rounded="xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-12">
              <h4 className="text-lg text-[var(--color-text)]">No se encontraron productos</h4>
              <p className="text-[var(--color-muted)]">Intenta ajustar los filtros de búsqueda</p>
              <div className="mt-4">
                <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {productos.map((producto) => {
                  const item = getCartItem(producto.id);
                  const isDisabled = isInCart(producto.id) && item ? item.cantidad >= producto.stock : false;

                  return (
                    <ProductCard
                      key={producto.id}
                      producto={producto}
                      onAddToCart={(p) => {
                        if (canAddToCart(p, 1)) {
                          addToCart(p, 1);
                          openCart?.();
                          toast.success(`${p.nombre} añadido al carrito`);
                        } else {
                          toast.error("Stock insuficiente para agregar más unidades");
                        }
                      }}
                      isDisabled={isDisabled}
                    />
                  );
                })}
              </div>

              {paginacion.totalPaginas > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginacion.pagina === 1}
                    onClick={() => handlePaginaChange(Math.max(1, paginacion.pagina - 1))}
                  >
                    Anterior
                  </Button>

                  {paginacionItems.items.map((page) => (
                    <button
                      key={page}
                      className={`px-3 py-1.5 text-sm rounded-md border ${
                        page === paginacion.pagina ? "border-[var(--color-button)] bg-[var(--color-button)] text-white" : "theme-surface-strong"
                      }`}
                      onClick={() => handlePaginaChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginacion.pagina === paginacion.totalPaginas}
                    onClick={() => handlePaginaChange(Math.min(paginacion.totalPaginas, paginacion.pagina + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-8">Cargando productos...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
