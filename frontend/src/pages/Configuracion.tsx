import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Settings, Save, RotateCcw, Building2, FileText, Warehouse,
  Factory, Monitor, CheckCircle, AlertTriangle, XCircle, Loader2,
  Eye, EyeOff, Hash, AtSign, Phone, MapPin, Percent, Upload, Trash2, ImageIcon
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { isValidRFC, isValidEmail, isValidCP, isValidPhone } from '../utils/validators';

interface ConfigItem {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  grupo: string;
  editable: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const grupos = [
  { key: 'empresa', label: 'Datos de la Empresa', icon: Building2, color: 'border-l-blue-500 bg-blue-50' },
  { key: 'facturacion', label: 'Facturacion Electronica (CFDI)', icon: FileText, color: 'border-l-green-500 bg-green-50' },
  { key: 'inventario', label: 'Inventario y Almacen', icon: Warehouse, color: 'border-l-purple-500 bg-purple-50' },
  { key: 'produccion', label: 'Produccion', icon: Factory, color: 'border-l-orange-500 bg-orange-50' },
  { key: 'sistema', label: 'Preferencias del Sistema', icon: Monitor, color: 'border-l-gray-500 bg-gray-50' },
];

const CLAVE_TO_TYPE: Record<string, 'text' | 'email' | 'number' | 'password' | 'tel' | 'toggle'> = {
  EMPRESA_RFC: 'text',
  EMPRESA_RAZON_SOCIAL: 'text',
  EMPRESA_REGIMEN_FISCAL: 'text',
  EMPRESA_CP: 'text',
  EMPRESA_CALLE: 'text',
  EMPRESA_NUM_EXT: 'text',
  EMPRESA_COLONIA: 'text',
  EMPRESA_MUNICIPIO: 'text',
  EMPRESA_ESTADO: 'text',
  EMPRESA_TELEFONO: 'tel',
  EMPRESA_EMAIL: 'email',
  FACTURA_SERIE: 'text',
  FACTURA_FOLIO_INICIAL: 'number',
  FACTURA_TASA_IVA: 'text',
  FACTURA_METODO_PAGO: 'text',
  FACTURA_FORMA_PAGO: 'text',
  FACTURA_USO_CFDI: 'text',
  CFDI_LUGAR_EXPEDICION: 'text',
  INV_ALERTA_STOCK_BAJO: 'toggle',
  INV_UNIDAD_PESO: 'text',
  PROD_TURNO_POR_DEFECTO: 'text',
  PROD_MARGEN_DEFECTO: 'number',
  SISTEMA_MONEDA: 'text',
  SISTEMA_DECIMALES: 'number',
  SISTEMA_ZONA_HORARIA: 'text',
};

const CLAVE_TO_ICON: Record<string, React.ElementType> = {
  EMPRESA_RFC: Hash,
  EMPRESA_EMAIL: AtSign,
  EMPRESA_TELEFONO: Phone,
  EMPRESA_CP: MapPin,
  FACTURA_TASA_IVA: Percent,
  CFDI_LUGAR_EXPEDICION: MapPin,
};

function getFieldValidator(clave: string) {
  if (clave === 'EMPRESA_RFC') return (v: string) => isValidRFC(v) ? '' : 'RFC invalido (12-13 caracteres)';
  if (clave === 'EMPRESA_EMAIL') return (v: string) => isValidEmail(v) ? '' : 'Email invalido';
  if (clave === 'EMPRESA_CP' || clave === 'CFDI_LUGAR_EXPEDICION') return (v: string) => isValidCP(v) ? '' : 'CP debe tener 5 digitos';
  if (clave === 'EMPRESA_TELEFONO') return (v: string) => isValidPhone(v) ? '' : 'Telefono debe tener 10 digitos';
  if (clave === 'FACTURA_TASA_IVA') return (v: string) => {
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0 && n <= 1 ? '' : 'Tasa IVA debe ser entre 0 y 1';
  };
  if (clave.endsWith('_FOLIO_INICIAL') || clave.endsWith('_MARGEN_DEFECTO') || clave.endsWith('_DECIMALES')) {
    return (v: string) => /^\d+$/.test(v) ? '' : 'Debe ser un numero entero';
  }
  return () => '';
}

function ConfigField({
  item,
  value,
  onChange,
  onSave,
  saveState,
}: {
  item: ConfigItem;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saveState: SaveState;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const type = CLAVE_TO_TYPE[item.clave] || 'text';
  const Icon = CLAVE_TO_ICON[item.clave];
  const validator = getFieldValidator(item.clave);
  const error = validator(value);
  const hasError = !!error && value.length > 0;
  const changed = value !== item.valor;

  if (type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          <span className="text-sm text-gray-700">{item.descripcion || item.clave}</span>
        </div>
        <button
          onClick={() => { onChange(value === 'true' ? 'false' : 'true'); onSave(); }}
          disabled={!item.editable}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value === 'true' ? 'bg-blue-600' : 'bg-gray-200'
          } ${!item.editable ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value === 'true' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
        {item.descripcion || item.clave}
        {changed && <span className="text-xs text-amber-600 font-normal">(modificado)</span>}
        {!item.editable && <span className="text-xs text-gray-400 font-normal">[solo lectura]</span>}
      </label>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          <input
            type={type === 'password' && !showPassword ? 'password' : type === 'tel' ? 'tel' : type === 'email' ? 'email' : type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={!item.editable || saveState === 'saving'}
            className={`block w-full rounded-md border px-3 py-2 text-sm pr-8 transition-colors ${
              hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                : changed
                ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500 bg-amber-50/30'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } ${!item.editable ? 'bg-gray-50 text-gray-500' : ''}`}
          />
          {hasError && (
            <AlertTriangle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
          )}
          {!hasError && changed && saveState !== 'saving' && (
            <button
              onClick={onSave}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
              title="Guardar"
            >
              <Save className="h-4 w-4" />
            </button>
          )}
          {saveState === 'saving' && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
          )}
          {saveState === 'saved' && (
            <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
          {saveState === 'error' && (
            <XCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
      {hasError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function Configuracion() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ empresa: true, facturacion: true });
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      let res = await api.get('/configuracion');
      if (res.data.length === 0) {
        await api.post('/configuracion/seed');
        res = await api.get('/configuracion');
      }
      setConfigs(res.data);
      const initial: Record<string, string> = {};
      res.data.forEach((c: ConfigItem) => {
        initial[c.clave] = c.valor;
      });
      setEditedValues(initial);
      setSaveStates({});
      const logoConfig = res.data.find((c: ConfigItem) => c.clave === 'EMPRESA_LOGO');
      if (logoConfig?.valor) setLogoUrl(`http://localhost:5000${logoConfig.valor}`);
    } catch (error) {
      toast.error('Error al cargar configuracion');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('El logo no debe superar 2 MB'); return; }
    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append('logo', file);
      const res = await api.post('/configuracion/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogoUrl(`http://localhost:5000${res.data.url}`);
      toast.success('Logo actualizado correctamente');
    } catch {
      toast.error('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('¿Eliminar el logo de la empresa?')) return;
    try {
      await api.delete('/configuracion/logo');
      setLogoUrl('');
      toast.success('Logo eliminado');
    } catch {
      toast.error('Error al eliminar el logo');
    }
  };

  const handleChange = (clave: string, valor: string) => {
    setEditedValues(prev => ({ ...prev, [clave]: valor }));
    setSaveStates(prev => ({ ...prev, [clave]: 'idle' }));
  };

  const handleSave = useCallback(async (clave: string) => {
    const validator = getFieldValidator(clave);
    const err = validator(editedValues[clave]);
    if (err) {
      toast.error(err);
      return;
    }
    setSaveStates(prev => ({ ...prev, [clave]: 'saving' }));
    try {
      await api.put(`/configuracion/${clave}`, { valor: editedValues[clave] });
      setSaveStates(prev => ({ ...prev, [clave]: 'saved' }));
      setConfigs(prev => prev.map(c => c.clave === clave ? { ...c, valor: editedValues[clave] } : c));
      const desc = configs.find(c => c.clave === clave)?.descripcion || clave;
      toast.success(`${desc} guardado`);
      setTimeout(() => {
        setSaveStates(prev => ({ ...prev, [clave]: 'idle' }));
      }, 2000);
    } catch (error: any) {
      setSaveStates(prev => ({ ...prev, [clave]: 'error' }));
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  }, [editedValues]);

  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      const changed: Record<string, string> = {};
      let hasErrors = false;
      configs.forEach(c => {
        if (c.editable && editedValues[c.clave] !== c.valor) {
          const err = getFieldValidator(c.clave)(editedValues[c.clave]);
          if (err) {
            toast.error(`${c.descripcion || c.clave}: ${err}`);
            hasErrors = true;
            return;
          }
          changed[c.clave] = editedValues[c.clave];
        }
      });
      if (hasErrors) return;
      if (Object.keys(changed).length === 0) {
        toast('No hay cambios pendientes');
        return;
      }
      await api.put('/configuracion/batch', changed);
      toast.success(`${Object.keys(changed).length} configuraciones guardadas`);
      loadConfigs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSavingAll(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('¿Crear configuraciones faltantes con valores por defecto?\n\nLos valores que ya existen NO se modificarán.')) return;
    try {
      await api.post('/configuracion/seed');
      toast.success('Configuraciones por defecto creadas (existentes sin cambios)');
      loadConfigs();
    } catch (error) {
      toast.error('Error al restaurar configuraciones');
    }
  };

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const empresaPreview = () => {
    const razon = editedValues['EMPRESA_RAZON_SOCIAL'] || configs.find(c => c.clave === 'EMPRESA_RAZON_SOCIAL')?.valor || '-';
    const rfc = editedValues['EMPRESA_RFC'] || configs.find(c => c.clave === 'EMPRESA_RFC')?.valor || '-';
    const cp = editedValues['EMPRESA_CP'] || configs.find(c => c.clave === 'EMPRESA_CP')?.valor || '-';
    const calle = editedValues['EMPRESA_CALLE'] || configs.find(c => c.clave === 'EMPRESA_CALLE')?.valor || '-';
    const num = editedValues['EMPRESA_NUM_EXT'] || configs.find(c => c.clave === 'EMPRESA_NUM_EXT')?.valor || '-';
    const colonia = editedValues['EMPRESA_COLONIA'] || configs.find(c => c.clave === 'EMPRESA_COLONIA')?.valor || '-';
    const tel = editedValues['EMPRESA_TELEFONO'] || configs.find(c => c.clave === 'EMPRESA_TELEFONO')?.valor || '-';
    const email = editedValues['EMPRESA_EMAIL'] || configs.find(c => c.clave === 'EMPRESA_EMAIL')?.valor || '-';
    return { razon, rfc, cp, calle, num, colonia, tel, email };
  };

  const preview = empresaPreview();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Cargando configuracion...</span>
      </div>
    );
  }

  const configsByGrupo = (grupo: string) => configs.filter(c => c.grupo === grupo);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuracion del Sistema
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Parametros de la empresa para facturacion CFDI y operacion del sistema.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleSeed}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar defaults
          </button>
          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm w-full sm:w-auto justify-center transition-colors"
          >
            {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingAll ? 'Guardando...' : 'Guardar todo'}
          </button>
        </div>
      </div>

      {/* Vista previa empresa */}
      {configsByGrupo('empresa').length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            Vista previa de datos fiscales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Razon Social:</span>
              <p className="font-medium text-gray-900">{preview.razon}</p>
            </div>
            <div>
              <span className="text-gray-500">RFC:</span>
              <p className="font-medium text-gray-900 font-mono">{preview.rfc}</p>
            </div>
            <div>
              <span className="text-gray-500">CP:</span>
              <p className="font-medium text-gray-900">{preview.cp}</p>
            </div>
            <div>
              <span className="text-gray-500">Direccion:</span>
              <p className="font-medium text-gray-900">{preview.calle} {preview.num}, {preview.colonia}</p>
            </div>
            <div>
              <span className="text-gray-500">Telefono:</span>
              <p className="font-medium text-gray-900">{preview.tel}</p>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <p className="font-medium text-gray-900">{preview.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logo de la empresa */}
      <div className="bg-white rounded-lg shadow-sm border border-l-4 border-l-blue-500 p-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <ImageIcon className="h-5 w-5 text-gray-600" />
          Logotipo de la Empresa
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-normal">aparece en PDFs y reportes</span>
        </h2>
        <div className="flex items-center gap-6">
          {/* Preview */}
          <div className="w-40 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo empresa" className="max-h-full max-w-full object-contain p-1" />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon className="h-8 w-8 mx-auto mb-1 opacity-40" />
                <p className="text-xs">Sin logo</p>
              </div>
            )}
          </div>
          {/* Controles */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Formatos: PNG, JPG, SVG · Máximo 2 MB</p>
            <p className="text-xs text-gray-400">Recomendado: fondo transparente, mínimo 200×200 px</p>
            <div className="flex gap-2 mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {logoUrl && (
                <button
                  onClick={handleLogoDelete}
                  className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-md hover:bg-red-100 text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grupos */}
      <div className="space-y-4">
        {grupos.map(grupo => {
          const items = configsByGrupo(grupo.key);
          if (items.length === 0) return null;
          const Icon = grupo.icon;
          const isOpen = expanded[grupo.key] !== false;
          return (
            <div key={grupo.key} className={`bg-white rounded-lg shadow-sm border border-l-4 ${grupo.color} overflow-hidden`}>
              <button
                onClick={() => toggleExpanded(grupo.key)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <h2 className="font-semibold text-gray-800">{grupo.label}</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {items.length} campos
                  </span>
                </div>
                {isOpen ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(item => (
                    <ConfigField
                      key={item.clave}
                      item={item}
                      value={editedValues[item.clave] ?? item.valor}
                      onChange={v => handleChange(item.clave, v)}
                      onSave={() => handleSave(item.clave)}
                      saveState={saveStates[item.clave] || 'idle'}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
