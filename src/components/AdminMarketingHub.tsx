import React, { useState } from "react";
import {
  Layers,
  Image as ImageIcon,
  LayoutList,
  Ticket,
  Sparkles,
  Plus,
  Save,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Copy,
  Upload,
  Layout,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "../utils/format";
import { ImageSizeInfo } from "./ImageSizeInfo";
import {
  PlatformSettings,
  BusinessCategory,
  Banner,
  FoodCategory,
  Coupon,
} from "../store/db";

interface AdminMarketingHubProps {
  settings: PlatformSettings;
  setSettings: (settings: PlatformSettings) => void;
  handleSaveSettings: (e?: React.FormEvent) => Promise<void>;
  isSavingSettings: boolean;
  handleSaveBusinessCategories: () => Promise<void>;
  isSavingBusinessCategories: boolean;
  handleAddBusinessCategory: () => void;
  handleDuplicateBusinessCategory: (cat: BusinessCategory) => void;
  handleReorderBusinessCategory: (index: number, direction: "up" | "down") => void;
  handleToggleBusinessCategoryActive: (id: string, active: boolean) => void;
  handleUpdateBusinessCategory: (id: string, field: keyof BusinessCategory, value: any) => void;
  handleDeleteBusinessCategory: (id: string) => void;
  handleAddBanner: () => void;
  handleUpdateBanner: (id: string, field: keyof Banner, value: any) => void;
  handleDeleteBanner: (id: string) => void;
  handleAddHeroBanner: () => void;
  handleUpdateHeroBanner: (id: string, field: keyof Banner, value: any) => void;
  handleDeleteHeroBanner: (id: string) => void;
  handleAddFoodCategory: () => void;
  handleUpdateFoodCategory: (id: string, field: keyof FoodCategory, value: any) => void;
  handleDeleteFoodCategory: (id: string) => void;
  coupons: Coupon[];
  setEditingCoupon: (coupon: any) => void;
  handleDeleteCoupon: (id: string) => void;
  setCropper: (cropper: any) => void;
}

export const AdminMarketingHub: React.FC<AdminMarketingHubProps> = ({
  settings,
  setSettings,
  handleSaveSettings,
  isSavingSettings,
  handleSaveBusinessCategories,
  isSavingBusinessCategories,
  handleAddBusinessCategory,
  handleDuplicateBusinessCategory,
  handleReorderBusinessCategory,
  handleToggleBusinessCategoryActive,
  handleUpdateBusinessCategory,
  handleDeleteBusinessCategory,
  handleAddBanner,
  handleUpdateBanner,
  handleDeleteBanner,
  handleAddHeroBanner,
  handleUpdateHeroBanner,
  handleDeleteHeroBanner,
  handleAddFoodCategory,
  handleUpdateFoodCategory,
  handleDeleteFoodCategory,
  coupons,
  setEditingCoupon,
  handleDeleteCoupon,
  setCropper,
}) => {
  const [subTab, setSubTab] = useState<
    "business_categories" | "banners" | "food_chips" | "coupons"
  >("business_categories");

  const activeCategoriesCount =
    settings.businessCategories?.filter((c) => c.active).length || 0;
  const totalCategoriesCount = settings.businessCategories?.length || 0;

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector Header */}
      <div className="bg-white rounded-2xl p-2 border border-neutral-200 shadow-xs flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab("business_categories")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            subTab === "business_categories"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categorías de Negocio & Slider</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              subTab === "business_categories"
                ? "bg-white/20 text-white"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {activeCategoriesCount} Activas
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("banners")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            subTab === "banners"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Banners & Sliders Hero</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("food_chips")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            subTab === "food_chips"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <LayoutList className="w-4 h-4" />
          <span>Chips de Especialidades / Comida</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("coupons")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            subTab === "coupons"
              ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Cupones de Descuento</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              subTab === "coupons"
                ? "bg-white/20 text-white"
                : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {coupons.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. BUSINESS CATEGORIES & SLIDER SUB-TAB */}
      {/* ========================================================================= */}
      {subTab === "business_categories" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Global Visibility Toggle Switch for Business Categories Nav */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white rounded-2xl border-2 border-orange-200 shadow-xs gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-neutral-900 text-base">
                  Barra Deslizante de Categorías de Negocio en la Página Principal
                </h3>
              </div>
              <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
                Esta barra muestra las categorías comerciales (Restaurantes, Salsamentarías, Verdulerías, Panaderías, etc.) y permite al cliente filtrar instantáneamente todos los negocios asociados a cada categoría.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-orange-200 shadow-xs shrink-0">
              <span className="text-xs font-bold text-neutral-800">
                {!settings.hideBusinessCategoryNav ? "Activa (Visible)" : "Desactivada (Oculta)"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!settings.hideBusinessCategoryNav}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hideBusinessCategoryNav: !e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          {/* Business Categories List Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-white border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-neutral-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" />
                  Lista de Categorías de Negocio ({totalCategoriesCount})
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  Cada categoría activa genera un botón de filtro deslizante en la pantalla principal.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddBusinessCategory}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl font-bold transition-all text-xs"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Categoría
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBusinessCategories()}
                  disabled={isSavingBusinessCategories}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-black transition-all text-xs shadow-md shadow-orange-500/25 disabled:opacity-50"
                >
                  {isSavingBusinessCategories ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Categorías</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 bg-neutral-50/50">
              <div className="space-y-4">
                {settings.businessCategories && settings.businessCategories.length > 0 ? (
                  settings.businessCategories.map((cat, index) => {
                    const isFirst = index === 0;
                    const isLast = index === (settings.businessCategories?.length || 1) - 1;

                    return (
                      <div
                        key={cat.id}
                        className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-xs ${
                          cat.active
                            ? "border-neutral-200 hover:border-orange-300 ring-1 ring-emerald-500/20"
                            : "border-neutral-200/80 bg-neutral-50/70 opacity-75"
                        }`}
                      >
                        {/* Header card */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-neutral-100">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-900 text-white font-black text-xs">
                              #{index + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-neutral-500">
                              Slug: <span className="text-neutral-800">{cat.id}</span>
                            </span>

                            {cat.active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <Eye className="w-3 h-3" />
                                Visible en Inicio
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-200 text-neutral-600">
                                <EyeOff className="w-3 h-3" />
                                Oculta en Inicio
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Reorder Up/Down */}
                            <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200">
                              <button
                                type="button"
                                title="Mover arriba"
                                disabled={isFirst}
                                onClick={() => handleReorderBusinessCategory(index, "up")}
                                className="p-1 text-neutral-600 hover:text-orange-600 disabled:opacity-25 hover:bg-white rounded transition-colors"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Mover abajo"
                                disabled={isLast}
                                onClick={() => handleReorderBusinessCategory(index, "down")}
                                className="p-1 text-neutral-600 hover:text-orange-600 disabled:opacity-25 hover:bg-white rounded transition-colors"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Duplicate */}
                            <button
                              type="button"
                              title="Duplicar categoría"
                              onClick={() => handleDuplicateBusinessCategory(cat)}
                              className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              title="Eliminar categoría"
                              onClick={() => handleDeleteBusinessCategory(cat.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-8 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-black uppercase text-neutral-600 tracking-wider mb-1">
                                  Título de Categoría *
                                </label>
                                <input
                                  type="text"
                                  value={cat.title}
                                  onChange={(e) =>
                                    handleUpdateBusinessCategory(
                                      cat.id,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="ej. Explorar Restaurantes"
                                  className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900 font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-black uppercase text-neutral-600 tracking-wider mb-1">
                                  Identificador / Slug (ID)
                                </label>
                                <input
                                  type="text"
                                  value={cat.id}
                                  onChange={(e) =>
                                    handleUpdateBusinessCategory(
                                      cat.id,
                                      "id",
                                      e.target.value.toLowerCase().trim(),
                                    )
                                  }
                                  placeholder="restaurant, grocery, liquor, etc."
                                  className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900 font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-black uppercase text-neutral-600 tracking-wider mb-1">
                                Subtítulo / Mensaje Promocional
                              </label>
                              <input
                                type="text"
                                value={cat.subtitle || ""}
                                onChange={(e) =>
                                  handleUpdateBusinessCategory(
                                    cat.id,
                                    "subtitle",
                                    e.target.value,
                                  )
                                }
                                placeholder="ej. Tus comidas favoritas a domicilio"
                                className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900"
                              />
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={cat.active}
                                  onChange={(e) =>
                                    handleToggleBusinessCategoryActive(cat.id, e.target.checked)
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                              <span className="text-xs font-bold text-neutral-800">
                                {cat.active
                                  ? "Habilitada (Aparece en el Slider de Inicio)"
                                  : "Deshabilitada (Oculta del Slider)"}
                              </span>
                            </div>
                          </div>

                          {/* Image */}
                          <div className="md:col-span-4 flex flex-col justify-between space-y-2">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-black uppercase text-neutral-600 tracking-wider">
                                  Imagen Slider (16:9)
                                </label>
                                <ImageSizeInfo type="cover" />
                              </div>
                              <div className="relative group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        setCropper({
                                          isOpen: true,
                                          imageSrc: ev.target?.result as string,
                                          type: "businessCategory",
                                          metaId: cat.id,
                                          aspectRatio: 16 / 9,
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="w-full border-2 border-dashed border-neutral-200 rounded-xl p-2.5 group-hover:border-orange-500 transition-colors flex items-center justify-center gap-2 bg-neutral-50 hover:bg-orange-50/50">
                                  <Upload className="w-4 h-4 text-neutral-500" />
                                  <span className="text-xs font-bold text-neutral-700">
                                    {cat.image ? "Cambiar Imagen" : "Subir Imagen"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {cat.image ? (
                              <div className="h-20 w-full rounded-xl overflow-hidden border border-neutral-200 relative group shadow-xs">
                                <img
                                  src={cat.image}
                                  alt={cat.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded-full">
                                    Vista Previa
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-20 w-full rounded-xl bg-neutral-100 border border-neutral-200 border-dashed flex items-center justify-center text-xs text-neutral-400 font-medium">
                                Sin imagen personalizada
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-neutral-200 border-dashed">
                    <Layout className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-neutral-700 mb-1">
                      No hay categorías de negocio configuradas
                    </h4>
                    <p className="text-neutral-500 text-xs mb-4">
                      Crea tu primera categoría para mostrarla en el carrusel de inicio.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddBusinessCategory}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition-colors shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir Primera Categoría
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom save bar */}
              <div className="mt-6 pt-4 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-neutral-500">
                  💡 Pulsa <strong className="text-neutral-800">"Guardar Categorías de Negocio"</strong> para persistir cambios y visibilidad en la base de datos.
                </p>
                <button
                  type="button"
                  onClick={() => handleSaveBusinessCategories()}
                  disabled={isSavingBusinessCategories}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-black transition-all text-sm shadow-md shadow-orange-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingBusinessCategories ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando en Base de Datos...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Categorías de Negocio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BANNERS & SLIDERS HERO SUB-TAB */}
      {/* ========================================================================= */}
      {subTab === "banners" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-in fade-in duration-200">
          {/* Global Visibility Toggle Switch for Hero Slider */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white rounded-2xl border-2 border-orange-200 shadow-xs gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-neutral-900 text-base">
                  Slider Hero Principal en la Página de Inicio
                </h3>
              </div>
              <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
                Controla si el carrusel de banners publicitarios y portada principal se muestra arriba en la página de inicio.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-orange-200 shadow-xs shrink-0">
              <span className="text-xs font-bold text-neutral-800">
                {!settings.hideHeroSlider ? "Activo (Visible)" : "Desactivado (Oculto)"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!settings.hideHeroSlider}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hideHeroSlider: !e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 overflow-hidden p-6 space-y-6">
            {/* Speed & Hero Config */}
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 space-y-4">
              <h4 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                Configuración General de Sliders
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Velocidad de Animación de Banners (segundos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={settings.bannerAnimationSpeed ?? 3}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bannerAnimationSpeed: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Límite de Restaurantes Destacados (Slider Inicio)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.featuredRestaurantsLimit ?? 2}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        featuredRestaurantsLimit: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-neutral-900 font-bold"
                  />
                </div>
              </div>

              {/* Hero Image */}
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Imagen de Cabecera Principal (Home)
                  </label>
                  <ImageSizeInfo type="cover" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <input
                    type="text"
                    value={settings.heroImage || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, heroImage: e.target.value })
                    }
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full sm:w-1/2 p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white text-neutral-900"
                  />
                  <div className="relative group w-full sm:w-auto">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setCropper({
                              isOpen: true,
                              imageSrc: ev.target?.result as string,
                              type: "heroImage",
                              aspectRatio: 16 / 9,
                            });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="w-full bg-neutral-100 text-neutral-700 font-bold px-4 py-2.5 rounded-xl hover:bg-neutral-200 transition-colors pointer-events-none flex items-center justify-center gap-2 border border-neutral-300 text-sm"
                    >
                      <Upload className="w-4 h-4" /> Subir imagen
                    </button>
                  </div>
                </div>

                {settings.heroImage && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-neutral-200">
                      <img
                        src={settings.heroImage}
                        alt="Hero Preview"
                        className="w-full h-full object-cover"
                        style={{
                          opacity:
                            settings.heroImageOpacity !== undefined
                              ? settings.heroImageOpacity / 100
                              : 0.6,
                        }}
                      />
                    </div>
                    <div className="w-full sm:w-1/2">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Opacidad ({settings.heroImageOpacity ?? 60}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.heroImageOpacity ?? 60}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            heroImageOpacity: Number(e.target.value),
                          })
                        }
                        className="w-full accent-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Banners Carousel */}
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-neutral-900">
                  Banners Hero Carrusel (Pantalla Principal)
                </h4>
                <button
                  type="button"
                  onClick={handleAddHeroBanner}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Añadir Banner Hero
                </button>
              </div>

              <div className="space-y-4">
                {settings.heroBanners && settings.heroBanners.length > 0 ? (
                  settings.heroBanners.map((banner) => (
                    <div
                      key={banner.id}
                      className="bg-white p-4 rounded-xl border border-neutral-200 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteHeroBanner(banner.id)}
                        className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Título
                          </label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) =>
                              handleUpdateHeroBanner(banner.id, "title", e.target.value)
                            }
                            className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Subtítulo
                          </label>
                          <input
                            type="text"
                            value={banner.subtitle || ""}
                            onChange={(e) =>
                              handleUpdateHeroBanner(banner.id, "subtitle", e.target.value)
                            }
                            className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Enlace / Destino
                          </label>
                          <input
                            type="text"
                            value={banner.link || ""}
                            onChange={(e) =>
                              handleUpdateHeroBanner(banner.id, "link", e.target.value)
                            }
                            placeholder="/restaurant/..."
                            className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setCropper({
                                    isOpen: true,
                                    imageSrc: ev.target?.result as string,
                                    type: "heroBanner",
                                    metaId: banner.id,
                                    aspectRatio: 16 / 9,
                                  });
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-neutral-200 rounded-lg p-2 flex items-center gap-2 bg-neutral-50">
                            <Upload className="w-4 h-4 text-neutral-500" />
                            <span className="text-xs font-bold text-neutral-700">
                              {banner.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                            </span>
                          </div>
                        </div>

                        {banner.imageUrl && (
                          <div className="h-16 w-32 rounded-lg overflow-hidden border border-neutral-200">
                            <img
                              src={banner.imageUrl}
                              alt="Hero Banner Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="checkbox"
                            id={`active-hero-${banner.id}`}
                            checked={banner.active}
                            onChange={(e) =>
                              handleUpdateHeroBanner(banner.id, "active", e.target.checked)
                            }
                            className="rounded text-orange-500 focus:ring-orange-500"
                          />
                          <label
                            htmlFor={`active-hero-${banner.id}`}
                            className="text-xs text-neutral-700 cursor-pointer font-bold"
                          >
                            Visible en Carrusel
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-white rounded-xl border border-neutral-200 border-dashed">
                    <p className="text-xs text-neutral-500">
                      No hay banners hero configurados (Se usará la portada por defecto).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Promo Banners */}
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-neutral-900">
                  Banners Promocionales (Debajo de Platos Populares)
                </h4>
                <button
                  type="button"
                  onClick={handleAddBanner}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Añadir Banner Promocional
                </button>
              </div>

              <div className="space-y-4">
                {settings.banners && settings.banners.length > 0 ? (
                  settings.banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="bg-white p-4 rounded-xl border border-neutral-200 relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Título
                          </label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) =>
                              handleUpdateBanner(banner.id, "title", e.target.value)
                            }
                            className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Subtítulo
                          </label>
                          <input
                            type="text"
                            value={banner.subtitle || ""}
                            onChange={(e) =>
                              handleUpdateBanner(banner.id, "subtitle", e.target.value)
                            }
                            className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Enlace / Destino
                          </label>
                          <input
                            type="text"
                            value={banner.link || ""}
                            onChange={(e) =>
                              handleUpdateBanner(banner.id, "link", e.target.value)
                            }
                            placeholder="/restaurant/..."
                            className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setCropper({
                                    isOpen: true,
                                    imageSrc: ev.target?.result as string,
                                    type: "banner",
                                    metaId: banner.id,
                                    aspectRatio: 21 / 9,
                                  });
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-neutral-200 rounded-lg p-2 flex items-center gap-2 bg-neutral-50">
                            <Upload className="w-4 h-4 text-neutral-500" />
                            <span className="text-xs font-bold text-neutral-700">
                              {banner.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                            </span>
                          </div>
                        </div>

                        {banner.imageUrl && (
                          <div className="h-16 w-32 rounded-lg overflow-hidden border border-neutral-200">
                            <img
                              src={banner.imageUrl}
                              alt="Banner Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="checkbox"
                            id={`active-banner-${banner.id}`}
                            checked={banner.active}
                            onChange={(e) =>
                              handleUpdateBanner(banner.id, "active", e.target.checked)
                            }
                            className="rounded text-orange-500 focus:ring-orange-500"
                          />
                          <label
                            htmlFor={`active-banner-${banner.id}`}
                            className="text-xs text-neutral-700 cursor-pointer font-bold"
                          >
                            Visible
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-white rounded-xl border border-neutral-200 border-dashed">
                    <p className="text-xs text-neutral-500">
                      No hay banners promocionales configurados.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Banners Action */}
            <div className="pt-4 border-t border-neutral-200 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isSavingSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando Banners...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Banners & Sliders</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 3. FOOD CATEGORY CHIPS SUB-TAB */}
      {/* ========================================================================= */}
      {subTab === "food_chips" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-in fade-in duration-200">
          {/* Global Visibility Toggle Switch for Food Category Chips */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white rounded-2xl border-2 border-orange-200 shadow-xs gap-4">
            <div>
              <div className="flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-neutral-900 text-base">
                  Barra de Chips Redondos de Comida (Pizza, Hamburguesa, Sushi...)
                </h3>
              </div>
              <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
                Esta barra de filtros rápidos circulares permite a los clientes filtrar por tipos de platos de comida rápida. Puedes desactivarla si deseas una vista principal más limpia.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-orange-200 shadow-xs shrink-0">
              <span className="text-xs font-bold text-neutral-800">
                {!settings.hideFoodCategoryChips ? "Activa (Visible)" : "Desactivada (Oculta)"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!settings.hideFoodCategoryChips}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hideFoodCategoryChips: !e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-neutral-900">
                Lista de Chips de Especialidades ({settings.foodCategories?.length || 0})
              </h4>
              <button
                type="button"
                onClick={handleAddFoodCategory}
                className="flex items-center gap-2 px-3.5 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl font-bold transition-all text-xs"
              >
                <Plus className="w-4 h-4" /> Añadir Chip de Comida
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.foodCategories && settings.foodCategories.length > 0 ? (
                settings.foodCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 relative flex flex-col justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => handleDeleteFoodCategory(cat.id)}
                      className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-3 mb-3 pr-8">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Nombre (ej. Pizza)
                        </label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) =>
                            handleUpdateFoodCategory(cat.id, "name", e.target.value)
                          }
                          className="w-full p-2 border border-neutral-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Emoji / Icono
                        </label>
                        <input
                          type="text"
                          value={cat.icon}
                          onChange={(e) =>
                            handleUpdateFoodCategory(cat.id, "icon", e.target.value)
                          }
                          placeholder="🍕"
                          className="w-full p-2 border border-neutral-200 rounded-lg text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-neutral-200">
                      <div className="relative group flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setCropper({
                                  isOpen: true,
                                  imageSrc: ev.target?.result as string,
                                  type: "foodCategory",
                                  metaId: cat.id,
                                  aspectRatio: 1,
                                });
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border border-dashed border-neutral-300 rounded-lg p-1.5 flex items-center justify-center gap-1.5 bg-white text-xs font-bold text-neutral-700 hover:border-orange-500 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{cat.imageUrl ? "Cambiar Imagen" : "Subir Imagen Redonda"}</span>
                        </div>
                      </div>

                      {cat.imageUrl && (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
                  <p className="text-xs text-neutral-500">
                    No hay chips de especialidad configurados.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-200 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isSavingSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando Chips...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Chips de Especialidades</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. COUPONS SUB-TAB */}
      {/* ========================================================================= */}
      {subTab === "coupons" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-neutral-900">Gestión de Cupones</h2>
              <p className="text-xs text-neutral-500">Administra códigos de descuento y promociones activas</p>
            </div>
            <button
              onClick={() =>
                setEditingCoupon({
                  code: "",
                  discountType: "percentage",
                  value: 0,
                  minOrderAmount: 0,
                  active: true,
                  timesUsed: 0,
                })
              }
              className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 flex items-center gap-2 shadow-sm transition-all text-xs"
            >
              <Plus className="w-4 h-4" /> Nuevo Cupón
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Código</th>
                    <th className="p-4 font-bold">Descuento</th>
                    <th className="p-4 font-bold">Mín. Pedido</th>
                    <th className="p-4 font-bold">Vigencia</th>
                    <th className="p-4 font-bold">Uso</th>
                    <th className="p-4 font-bold">Estado</th>
                    <th className="p-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-neutral-400 font-medium">
                        No hay cupones creados actualmente.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-orange-500" />
                            <span className="font-black text-neutral-900">{coupon.code}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-neutral-700">
                            {coupon.discountType === "percentage"
                              ? `${coupon.value}%`
                              : `${formatCurrency(coupon.value)}`}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-600 font-medium">
                          {formatCurrency(coupon.minOrderAmount)}
                        </td>
                        <td className="p-4 text-xs text-neutral-500">
                          {coupon.startDate
                            ? new Date(coupon.startDate).toLocaleDateString()
                            : "N/A"}{" "}
                          -{" "}
                          {coupon.endDate
                            ? new Date(coupon.endDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-neutral-700">
                              {coupon.timesUsed} usos
                            </span>
                            {coupon.usageLimit && (
                              <span className="text-[10px] text-neutral-400">
                                Límite: {coupon.usageLimit}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              coupon.active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {coupon.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingCoupon(coupon)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
