// src/components/ImageGenerationForm.tsx
import React, { useState, useCallback, useRef } from 'react';
import { useGenerationContext } from '../context/GenerationContext';
import { useAuth } from '../hooks/useAuth';

interface ImageGenerationFormProps {
  onGenerate?: (prompt: string) => void;
}

export const ImageGenerationForm: React.FC<ImageGenerationFormProps> = ({
  onGenerate,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelTier, setModelTier] = useState<'flux' | 'krea'>('flux');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [useNegative, setUseNegative] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  
  const { handleGenerate } = useGenerationContext();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!prompt.trim() || !profile) return;

      setIsGenerating(true);
      try {
        const generateParams = {
          prompt,
          negative_prompt: useNegative ? negativePrompt : undefined,
          aspect_ratio: aspectRatio,
          seed: seed ?? -1,
          model_tier: modelTier,
          reference_images: referenceImages,
        };

        await handleGenerate(generateParams);
        
        onGenerate?.(prompt);
        setPrompt('');
      } catch (error) {
        console.error('Error generating image:', error);
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, profile, aspectRatio, seed, modelTier, useNegative, negativePrompt, referenceImages, handleGenerate, onGenerate]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReferenceImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Model Tier Selection */}
      <div>
        <label style={{ display: 'block', fontFamily: 'var(--pf-font-ui)', fontSize: '12px', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: '8px' }}>
          Modelo
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            onClick={() => setModelTier('flux')}
            style={{ flex: 1, minWidth: 200, padding: '16px', borderRadius: '16px', border: modelTier === 'flux' ? '1.5px solid var(--pf-text-primary)' : '1px solid var(--pf-border-default)', background: modelTier === 'flux' ? 'var(--pf-bg-secondary)' : 'transparent', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '14px', fontWeight: 700, color: 'var(--pf-text-primary)', marginBottom: '4px' }}>Flux.1</div>
            <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '12px', color: 'var(--pf-text-muted)' }}>Alta fidelidad, rápido</div>
          </div>
          <div
            onClick={() => setModelTier('krea')}
            style={{ flex: 1, minWidth: 200, padding: '16px', borderRadius: '16px', border: modelTier === 'krea' ? '1.5px solid var(--pf-text-primary)' : '1px solid var(--pf-border-default)', background: modelTier === 'krea' ? 'var(--pf-bg-secondary)' : 'transparent', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '14px', fontWeight: 700, color: 'var(--pf-text-primary)', marginBottom: '4px' }}>Krea AI</div>
            <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '12px', color: 'var(--pf-text-muted)' }}>Estilo artístico, detallado</div>
          </div>
        </div>
      </div>

      {/* Prompt Input */}
      <div style={{ background: 'var(--pf-glass-surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--pf-border-subtle)', borderRadius: '24px', padding: '20px' }}>
        <label style={{ display: 'block', fontFamily: 'var(--pf-font-ui)', fontSize: '12px', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: '8px' }}>
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe la imagen que quieres crear..."
          rows={5}
          className="pf-font-prompt"
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--pf-font-display)', fontSize: '1.125rem', color: 'var(--pf-text-primary)', resize: 'vertical', minHeight: '80px' }}
          disabled={isGenerating}
        />
        
        {useNegative && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--pf-border-subtle)' }}>
            <label style={{ display: 'block', fontFamily: 'var(--pf-font-ui)', fontSize: '12px', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: '8px' }}>
              Negative Prompt
            </label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Elementos a evitar..."
              style={{ width: '100%', background: 'transparent', border: '1px solid var(--pf-border-default)', borderRadius: '12px', padding: '10px 14px', color: 'var(--pf-text-primary)', fontFamily: 'var(--pf-font-ui)', fontSize: '14px', outline: 'none' }}
              disabled={isGenerating}
            />
          </div>
        )}
        
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setUseNegative(!useNegative)}
            style={{ background: 'transparent', border: 'none', color: 'var(--pf-text-muted)', fontSize: '12px', cursor: 'pointer', padding: '0', textDecoration: 'underline', textUnderlineOffset: '2px', fontFamily: 'var(--pf-font-ui)' }}
          >
            {useNegative ? 'Ocultar negative prompt' : 'Añadir negative prompt'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '12px', color: 'var(--pf-text-secondary)' }}>Seed:</label>
            <input
              type="number"
              value={seed ?? ''}
              onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Auto"
              style={{ width: '80px', background: 'transparent', border: '1px solid var(--pf-border-default)', borderRadius: '8px', padding: '4px 8px', color: 'var(--pf-text-primary)', fontFamily: 'var(--pf-font-ui)', fontSize: '12px', outline: 'none' }}
              disabled={isGenerating}
            />
          </div>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div style={{ background: 'var(--pf-glass-surface)', border: '1px solid var(--pf-border-subtle)', borderRadius: '20px', padding: '20px' }}>
        <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 700, color: 'var(--pf-text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Relación de Aspecto
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '1:1', value: '1:1' },
            { label: '16:9', value: '16:9' },
            { label: '9:16', value: '9:16' },
            { label: '4:3', value: '4:3' },
            { label: '3:4', value: '3:4' },
          ].map((ratio) => (
            <div
              key={ratio.value}
              onClick={() => setAspectRatio(ratio.value)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', borderRadius: '14px', border: aspectRatio === ratio.value ? '1.5px solid var(--pf-text-primary)' : '1px solid var(--pf-border-default)', background: aspectRatio === ratio.value ? 'var(--pf-bg-secondary)' : 'transparent', cursor: 'pointer', minWidth: '80px' }}
            >
              <span style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '13px', fontWeight: 600, color: aspectRatio === ratio.value ? 'var(--pf-text-primary)' : 'var(--pf-text-secondary)' }}>{ratio.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reference Images */}
      <div>
        <div style={{ fontFamily: 'var(--pf-font-ui)', fontSize: '12px', fontWeight: 600, color: 'var(--pf-text-secondary)', marginBottom: '8px' }}>
          Imágenes de Referencia
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {referenceImages.map((file, index) => (
            <div key={index} style={{ width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid var(--pf-border-default)' }}>
              <img src={URL.createObjectURL(file)} alt={`Reference ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => removeReferenceImage(index)}
                style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
              >
                ×
              </button>
            </div>
          ))}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '84px', height: '84px', borderRadius: '12px', border: '1px dashed var(--pf-border-default)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--pf-text-muted)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isGenerating || !prompt.trim()}
        style={{
          alignSelf: 'flex-start',
          background: isGenerating || !prompt.trim() ? 'var(--pf-border-subtle)' : 'var(--pf-text-primary)',
          color: '#FFFFFF',
          fontFamily: 'var(--pf-font-ui)',
          fontSize: '1rem',
          fontWeight: 600,
          padding: '14px 32px',
          borderRadius: '9999px',
          border: 'none',
          cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
          opacity: isGenerating || !prompt.trim() ? '0.6' : '1',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--pf-shadow-floating)',
        }}
        onMouseEnter={(e) => {
          if (!isGenerating && prompt.trim()) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.opacity = isGenerating || !prompt.trim() ? '0.6' : '1';
        }}
      >
        {isGenerating ? 'Generando...' : 'Generar Imagen'}
      </button>
    </form>
  );
};

export default ImageGenerationForm;