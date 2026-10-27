import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Camera, Check, Eye, Layers, Move, RotateCcw, Sparkles, Upload, UserPlus, X, ZoomIn } from 'lucide-react'
import type { DribbleType, PlayerConfig } from '../game/engine'
import {
  BEARD_STYLES,
  BOOT_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  analyzePhotoForPlayerAppearance,
  defaultAppearanceForIndex,
  type FaceMapMode,
  type PhotoCropConfig,
  type PlayerAppearance,
} from '../game/playerModel3d'
import { PreMatchShowcase3D, type ShowcaseCameraMode } from './PreMatchShowcase3D'

interface PlayerScannerModalProps {
  nextIndex: number
  suggestedNumber: number
  onClose: () => void
  onCreatePlayer: (
    newPlayer: PlayerConfig,
    jerseyNumber: number,
    placement: 'bench' | 'starter',
    replaceStarterIndex: number
  ) => void
  starterNames: { index: number; number: number; name: string; role: string }[]
}

const DRIBBLE_OPTIONS: { id: DribbleType; name: string }[] = [
  { id: 'elastico', name: 'Elastico' },
  { id: 'roulette', name: 'Roulette' },
  { id: 'stepover', name: 'Stepover' },
  { id: 'body-feint', name: 'Body Feint' },
  { id: 'stop-go', name: 'Stop & Go' },
  { id: 'sombrero', name: 'Sombrero' },
]

// User's uploaded Lamine Yamal full-body reference photo in workspace
const LAMINE_DEMO_PHOTO_URL = '/assets/aistudio/images__3__96ec9ef2.jfif'

export function PlayerScannerModal({
  nextIndex,
  suggestedNumber,
  onClose,
  onCreatePlayer,
  starterNames,
}: PlayerScannerModalProps) {
  const [name, setName] = useState(`Lamine Yamal`)
  const [jerseyNumber, setJerseyNumber] = useState(19)
  const [iq, setIq] = useState(96)
  const [size, setSize] = useState(98)
  const [power, setPower] = useState(91)
  const [dribble, setDribble] = useState<DribbleType>('elastico')
  const [placement, setPlacement] = useState<'starter' | 'bench'>('starter')
  const [replaceIdx, setReplaceIdx] = useState(9)
  const [appearance, setAppearance] = useState<PlayerAppearance>(() => defaultAppearanceForIndex(nextIndex))
  const [previewCam, setPreviewCam] = useState<ShowcaseCameraMode>('body')
  const [scanStatus, setScanStatus] = useState<string>(
    'Upload a full-body or portrait photo (or drag the green Face Target on the photo) to reconstruct a 3D player & kit.'
  )

  // Aspect-preserved source image & interactive crop state
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null)
  const sourceImgRef = useRef<HTMLImageElement | null>(null)
  const [cropConfig, setCropConfig] = useState<PhotoCropConfig>({
    faceCenterX: 0.506,
    faceCenterY: 0.116,
    faceRadius: 0.054,
    isFullBody: true,
  })
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 512 }, height: { ideal: 512 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraActive(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setCameraError('Camera access was blocked or unavailable. Please use "Upload Photo" instead.')
      setCameraActive(false)
    }
  }

  /**
   * Preserves the uploaded image's full aspect ratio (up to 512px max dimension)
   * so full-body photos are NEVER center-cropped at the torso before head/kit segmentation.
   */
  const processImageInto3DAppearance = (
    rawUrl: string,
    sourceLabel: string,
    overrideCrop?: Partial<PhotoCropConfig>,
    presetPlayerName?: string,
    presetKitNumber?: number
  ) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const maxDim = 512
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const dw = Math.max(64, Math.round(img.width * scale))
      const dh = Math.max(64, Math.round(img.height * scale))

      const c = document.createElement('canvas')
      c.width = dw
      c.height = dh
      const ctx = c.getContext('2d')!
      ctx.clearRect(0, 0, dw, dh)
      ctx.drawImage(img, 0, 0, dw, dh)
      const normalizedDataUrl = c.toDataURL('image/png')

      const normImg = new Image()
      normImg.onload = () => {
        sourceImgRef.current = normImg
        setSourceDataUrl(normalizedDataUrl)

        const autoApp = analyzePhotoForPlayerAppearance(normImg, normalizedDataUrl, nextIndex, overrideCrop)
        if (autoApp.photoCrop) {
          setCropConfig(autoApp.photoCrop)
        }
        setAppearance(prev => ({
          ...prev,
          ...autoApp,
          hairStyle: autoApp.hairStyle ?? prev.hairStyle,
          // Always default to 'photo-blend' so the aligned face photo maps onto the 3D head & nose immediately!
          faceMapMode: 'photo-blend',
        }))
        if (presetPlayerName) setName(presetPlayerName)
        if (presetKitNumber) setJerseyNumber(presetKitNumber)

        const modeDesc = autoApp.photoCrop?.isFullBody
          ? `Full-Body 3D Mapped (Skin/Nose ${autoApp.skinTone}, Hair ${autoApp.hairColor} & Kit extracted!)`
          : `Portrait 3D Face Mapped (Skin/Nose ${autoApp.skinTone}, Hair ${autoApp.hairColor} extracted!)`
        setScanStatus(`${sourceLabel}: ${modeDesc}`)
      }
      normImg.src = normalizedDataUrl
    }
    img.src = rawUrl
  }

  /**
   * Re-runs 3D head/kit segmentation whenever the user drags or zooms the alignment oval on the photo!
   */
  const applyManualCropUpdate = (nextCrop: PhotoCropConfig) => {
    setCropConfig(nextCrop)
    const normImg = sourceImgRef.current
    if (!normImg || !sourceDataUrl) return
    const updatedApp = analyzePhotoForPlayerAppearance(normImg, sourceDataUrl, nextIndex, nextCrop)
    setAppearance(prev => ({
      ...prev,
      ...updatedApp,
      faceMapMode: prev.faceMapMode ?? 'photo-blend',
    }))
    setScanStatus(
      `Head focus (${Math.round(nextCrop.faceCenterX * 100)}%, ${Math.round(
        nextCrop.faceCenterY * 100
      )}%) · Auto Skin/Nose ${updatedApp.skinTone} · Hair ${updatedApp.hairColor}`
    )
  }

  const updateHeadFromPointer = (clientX: number, clientY: number) => {
    const el = viewportRef.current
    if (!el || !sourceDataUrl) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const relX = Math.max(0.08, Math.min(0.92, (clientX - rect.left) / rect.width))
    const relY = Math.max(0.05, Math.min(0.92, (clientY - rect.top) / rect.height))
    applyManualCropUpdate({
      ...cropConfig,
      faceCenterX: relX,
      faceCenterY: relY,
    })
  }

  const handlePointerDownCrop = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!sourceDataUrl || cameraActive) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDraggingCrop(true)
    updateHeadFromPointer(e.clientX, e.clientY)
  }

  const handlePointerMoveCrop = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop) return
    updateHeadFromPointer(e.clientX, e.clientY)
  }

  const handlePointerUpCrop = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop) return
    setIsDraggingCrop(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const handleCaptureCameraFrame = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return
    const vw = video.videoWidth
    const vh = video.videoHeight
    const maxDim = 512
    const scale = Math.min(1, maxDim / Math.max(vw, vh))
    const dw = Math.round(vw * scale)
    const dh = Math.round(vh * scale)

    const c = document.createElement('canvas')
    c.width = dw
    c.height = dh
    const ctx = c.getContext('2d')!
    // Mirror horizontally for natural selfie scan
    ctx.translate(dw, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, dw, dh)
    const dataUrl = c.toDataURL('image/png')
    stopCamera()
    processImageInto3DAppearance(dataUrl, '3D Live Camera Scan', { isFullBody: false })
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        stopCamera()
        processImageInto3DAppearance(reader.result, 'Photo-to-3D Scan')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Automatically load the Lamine Yamal full-body reference on first open with nose-centered face alignment
  useEffect(() => {
    processImageInto3DAppearance(
      LAMINE_DEMO_PHOTO_URL,
      'Lamine Yamal Full-Body 3D Reconstruction',
      {
        faceCenterX: 0.506,
        faceCenterY: 0.116,
        faceRadius: 0.054,
        isFullBody: true,
      },
      'Lamine Yamal',
      19
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = () => {
    const cleanName = name.trim() || `Player ${nextIndex + 1}`
    const newPlayer: PlayerConfig = {
      name: cleanName,
      size,
      power,
      iq,
      dribble,
      appearance,
    }
    onCreatePlayer(newPlayer, jerseyNumber, placement, replaceIdx)
  }

  const previewPlayerConfig: PlayerConfig = {
    name: name.trim() || 'New Star',
    size,
    power,
    iq,
    dribble,
    appearance,
  }

  const zoomFactor = Number((0.18 / Math.max(0.04, cropConfig.faceRadius)).toFixed(1))

  return (
    <div className="scanner-modal-backdrop" role="dialog" aria-modal="true" aria-label="Create and scan new 3D player">
      <div className="scanner-modal-shell scanner-modal-wide">
        <header className="scanner-modal-header">
          <div>
            <span className="scanner-kicker">
              FULL-BODY &amp; BIOMETRIC 3D PLAYER RECONSTRUCTION · DRAG PHOTO TARGET TO ALIGN HEAD
            </span>
            <h2>CREATE &amp; RECONSTRUCT 3D PLAYER FROM PHOTO</h2>
          </div>
          <button type="button" className="scanner-close-btn" onClick={onClose} aria-label="Close player creator">
            <X size={18} />
          </button>
        </header>

        <div className="scanner-modal-grid">
          {/* Left Column: Interactive Drag/Zoom Photo Alignment + Live 3D Player Reconstruction */}
          <section className="scanner-capture-col">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <div className="scanner-dual-stage">
              {/* Stage A: Interactive Source Photo with Draggable Head/Body Segmentation Target */}
              <div className="scanner-photo-stage">
                <div className="scanner-stage-label">
                  <span>1. SOURCE PHOTO (DRAG TARGET TO MOVE)</span>
                  {sourceDataUrl && (
                    <button
                      type="button"
                      className="scanner-mini-reset"
                      onClick={() =>
                        processImageInto3DAppearance(
                          sourceDataUrl,
                          'Auto-Segmented 3D Scan'
                        )
                      }
                      title="Auto-detect head and body regions"
                    >
                      <RotateCcw size={11} /> AUTO-ALIGN
                    </button>
                  )}
                </div>

                <div
                  ref={viewportRef}
                  className={`scanner-viewport interactive-crop-stage ${sourceDataUrl && !cameraActive ? 'draggable' : ''}`}
                  onPointerDown={handlePointerDownCrop}
                  onPointerMove={handlePointerMoveCrop}
                  onPointerUp={handlePointerUpCrop}
                >
                  {cameraActive ? (
                    <div className="scanner-video-wrap">
                      <video ref={videoRef} playsInline muted autoPlay className="scanner-video" />
                      <div className="scanner-face-guide">
                        <span>ALIGN FACE IN 3D SCAN OVAL</span>
                      </div>
                    </div>
                  ) : sourceDataUrl ? (
                    <div className="scanner-interactive-canvas-wrap">
                      <img
                        src={sourceDataUrl}
                        alt="Uploaded source for 3D reconstruction"
                        className="scanner-full-source-img"
                        draggable={false}
                      />

                      {/* Draggable Head/Face Extraction Ring */}
                      <div
                        className="scanner-head-target-box"
                        style={{
                          left: `${cropConfig.faceCenterX * 100}%`,
                          top: `${cropConfig.faceCenterY * 100}%`,
                          width: `${Math.max(14, cropConfig.faceRadius * 210)}%`,
                          height: `${Math.max(14, cropConfig.faceRadius * 240)}%`,
                        }}
                      >
                        <span className="target-tag">HEAD / FACE</span>
                      </div>

                      {/* Full-Body Kit Segmentation Guides (Jersey + Shorts + Socks) */}
                      {cropConfig.isFullBody && (
                        <>
                          <div className="scanner-body-zone-guide torso-zone">
                            <span>3D JERSEY TORSO</span>
                          </div>
                          <div className="scanner-body-zone-guide shorts-zone">
                            <span>3D SHORTS</span>
                          </div>
                        </>
                      )}

                      <div className="scanner-drag-hint">
                        <Move size={11} /> Drag anywhere to move Head box
                      </div>
                    </div>
                  ) : (
                    <div className="scanner-empty-prompt">
                      <UserPlus size={34} />
                      <strong>UPLOAD FULL-BODY OR FACE PHOTO</strong>
                      <p>
                        Segments head, hair, skin tone, jersey, shorts, and socks into a real articulated 3D footballer.
                      </p>
                    </div>
                  )}
                </div>

                {/* Zoom & Framing Mode Controls */}
                {sourceDataUrl && !cameraActive && (
                  <div className="scanner-crop-controls">
                    <div className="crop-slider-row">
                      <span>
                        <ZoomIn size={12} /> HEAD BOX ZOOM ({zoomFactor}x)
                      </span>
                      <input
                        type="range"
                        min={4}
                        max={26}
                        step={0.5}
                        value={Math.round((0.3 - cropConfig.faceRadius) * 100)}
                        onChange={e => {
                          const val = Number(e.target.value) / 100
                          const nextRad = Math.max(0.045, Math.min(0.26, 0.3 - val))
                          applyManualCropUpdate({ ...cropConfig, faceRadius: nextRad })
                        }}
                      />
                    </div>

                    <div className="crop-mode-pills">
                      <button
                        type="button"
                        className={cropConfig.isFullBody ? 'active' : ''}
                        onClick={() =>
                          applyManualCropUpdate({
                            ...cropConfig,
                            isFullBody: true,
                            faceCenterY: cropConfig.faceCenterY > 0.3 ? 0.11 : cropConfig.faceCenterY,
                            faceRadius: Math.min(cropConfig.faceRadius, 0.095),
                          })
                        }
                      >
                        Full-Body Photo (Head + Kit)
                      </button>
                      <button
                        type="button"
                        className={!cropConfig.isFullBody ? 'active' : ''}
                        onClick={() =>
                          applyManualCropUpdate({
                            ...cropConfig,
                            isFullBody: false,
                            faceCenterX: 0.5,
                            faceCenterY: 0.45,
                            faceRadius: 0.22,
                          })
                        }
                      >
                        Face Portrait Close-Up
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stage B: Live 3D Articulated Player Preview */}
              <div className="scanner-3d-live-stage">
                <div className="scanner-stage-label">
                  <span>2. LIVE 3D PLAYER RECONSTRUCTION</span>
                  <div className="scanner-cam-pills">
                    <button
                      type="button"
                      className={previewCam === 'body' ? 'active' : ''}
                      onClick={() => setPreviewCam('body')}
                    >
                      Full 3D Body
                    </button>
                    <button
                      type="button"
                      className={previewCam === 'face' ? 'active' : ''}
                      onClick={() => setPreviewCam('face')}
                    >
                      3D Face Close-Up
                    </button>
                  </div>
                </div>

                <div className="scanner-3d-canvas-box">
                  <PreMatchShowcase3D
                    players={[previewPlayerConfig]}
                    numbers={[jerseyNumber]}
                    selectedPlayer={0}
                    cameraMode={previewCam}
                    onSelectCameraMode={setPreviewCam}
                  />
                </div>

                {/* Face Rendering Mode Selector + Isolated Face Thumbnail */}
                <div className="scanner-face-mode-bar">
                  {appearance.faceCropDataUrl && (
                    <img
                      src={appearance.faceCropDataUrl}
                      alt="Extracted Head Crop"
                      className="scanner-extracted-face-thumb"
                      title="Isolated Head Crop (Torso/Shorts never touch the face!)"
                    />
                  )}
                  <div className="scanner-face-mode-buttons">
                    <span>3D HEAD RENDERING MODE:</span>
                    <div>
                      <button
                        type="button"
                        className={(appearance.faceMapMode ?? 'photo-blend') === 'photo-blend' ? 'active' : ''}
                        onClick={() => {
                          setAppearance(a => ({ ...a, faceMapMode: 'photo-blend' as FaceMapMode }))
                          setPreviewCam('face')
                        }}
                      >
                        <Eye size={11} /> 3D Photo-Mapped Face + Nose
                      </button>
                      <button
                        type="button"
                        className={appearance.faceMapMode === 'sculpted' ? 'active' : ''}
                        onClick={() => setAppearance(a => ({ ...a, faceMapMode: 'sculpted' as FaceMapMode }))}
                      >
                        <Check size={11} /> 3D Realistic Player
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="scanner-capture-buttons">
              <button
                type="button"
                className="scanner-primary-action"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={15} />
                <span>UPLOAD ANY PHOTO</span>
              </button>

              <button
                type="button"
                className="scanner-secondary-action"
                onClick={() =>
                  processImageInto3DAppearance(
                    LAMINE_DEMO_PHOTO_URL,
                    'Lamine Yamal Full-Body 3D Reconstruction',
                    {
                      faceCenterX: 0.506,
                      faceCenterY: 0.116,
                      faceRadius: 0.054,
                      isFullBody: true,
                    },
                    'Lamine Yamal',
                    19
                  )
                }
              >
                <Sparkles size={15} />
                <span>LOAD LAMINE YAMAL DEMO</span>
              </button>

              {!cameraActive ? (
                <button type="button" className="scanner-secondary-action" onClick={startCamera}>
                  <Camera size={15} />
                  <span>LIVE CAMERA</span>
                </button>
              ) : (
                <button type="button" className="scanner-capture-trigger" onClick={handleCaptureCameraFrame}>
                  <Sparkles size={15} />
                  <span>CAPTURE FRAME</span>
                </button>
              )}
            </div>

            {cameraError && <p className="scanner-error-msg">{cameraError}</p>}
            <div className="scanner-status-box">
              <Layers size={14} />
              <span>{scanStatus}</span>
            </div>

            {/* Extracted 3D Kit & Likeness Swatches */}
            <div className="scanner-appearance-tuning">
              <div className="swatch-row">
                <span>EXTRACTED 3D KIT COLORS (JERSEY · TRIM · SHORTS · SOCKS · BOOTS)</span>
                <div className="extracted-kit-row">
                  <label className="kit-color-pill">
                    <span>Jersey</span>
                    <input
                      type="color"
                      value={appearance.customJerseyColor || '#d91c24'}
                      onChange={e => setAppearance(a => ({ ...a, customJerseyColor: e.target.value }))}
                    />
                  </label>
                  <label className="kit-color-pill">
                    <span>Trim</span>
                    <input
                      type="color"
                      value={appearance.customJerseyTrimColor || '#f59e0b'}
                      onChange={e => setAppearance(a => ({ ...a, customJerseyTrimColor: e.target.value }))}
                    />
                  </label>
                  <label className="kit-color-pill">
                    <span>Shorts</span>
                    <input
                      type="color"
                      value={appearance.customShortsColor || '#15367e'}
                      onChange={e => setAppearance(a => ({ ...a, customShortsColor: e.target.value }))}
                    />
                  </label>
                  <label className="kit-color-pill">
                    <span>Socks</span>
                    <input
                      type="color"
                      value={appearance.customSocksColor || '#d91c24'}
                      onChange={e => setAppearance(a => ({ ...a, customSocksColor: e.target.value }))}
                    />
                  </label>
                  <div className="color-swatches">
                    {BOOT_COLORS.slice(0, 5).map(bc => (
                      <button
                        key={bc.id}
                        type="button"
                        className={`color-swatch-btn ${appearance.bootColor === bc.id ? 'active' : ''}`}
                        style={{ backgroundColor: bc.id }}
                        onClick={() => setAppearance(a => ({ ...a, bootColor: bc.id }))}
                        title={`Boots: ${bc.name}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="swatch-row">
                <span>AUTO-DETECTED SKIN / NOSE TONE ({appearance.skinTone}) &amp; HAIR ({appearance.hairColor})</span>
                <div className="extracted-kit-row">
                  <label className="kit-color-pill" title="Exact detected Skin & Nose color from photo">
                    <span>Skin/Nose</span>
                    <input
                      type="color"
                      value={appearance.skinTone || '#c6865c'}
                      onChange={e => setAppearance(a => ({ ...a, skinTone: e.target.value }))}
                    />
                  </label>
                  <div className="color-swatches">
                    {SKIN_TONES.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        className={`color-swatch-btn ${appearance.skinTone === st.id ? 'active' : ''}`}
                        style={{ backgroundColor: st.id }}
                        onClick={() => setAppearance(a => ({ ...a, skinTone: st.id }))}
                        title={st.name}
                      />
                    ))}
                  </div>
                  <span className="swatch-divider">|</span>
                  <label className="kit-color-pill" title="Exact detected Hair Crown color from photo">
                    <span>Hair</span>
                    <input
                      type="color"
                      value={appearance.hairColor || '#181412'}
                      onChange={e => setAppearance(a => ({ ...a, hairColor: e.target.value }))}
                    />
                  </label>
                  <div className="color-swatches">
                    {HAIR_COLORS.map(hc => (
                      <button
                        key={hc.id}
                        type="button"
                        className={`color-swatch-btn ${appearance.hairColor === hc.id ? 'active' : ''}`}
                        style={{ backgroundColor: hc.id }}
                        onClick={() => setAppearance(a => ({ ...a, hairColor: hc.id }))}
                        title={hc.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="swatch-row">
                <span>3D HAIRSTYLE &amp; FACIAL HAIR</span>
                <div className="mini-option-grid">
                  {HAIR_STYLES.map(hs => (
                    <button
                      key={hs.id}
                      type="button"
                      className={appearance.hairStyle === hs.id ? 'active' : ''}
                      onClick={() => setAppearance(a => ({ ...a, hairStyle: hs.id }))}
                    >
                      {hs.name}
                    </button>
                  ))}
                </div>
                <div className="mini-option-grid cols-4" style={{ marginTop: 5 }}>
                  {BEARD_STYLES.map(bs => (
                    <button
                      key={bs.id}
                      type="button"
                      className={appearance.beardStyle === bs.id ? 'active' : ''}
                      onClick={() => setAppearance(a => ({ ...a, beardStyle: bs.id }))}
                    >
                      {bs.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Player Identity, Squad Placement (Starter vs Bench), and Attributes */}
          <section className="scanner-config-col">
            <div className="scanner-identity-row">
              <label className="name-field">
                <span>NEW PLAYER NAME</span>
                <input
                  value={name}
                  maxLength={14}
                  onChange={e => setName(e.target.value)}
                  placeholder="Player Name"
                />
              </label>
              <label className="name-field scanner-num-field">
                <span>KIT #</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={jerseyNumber}
                  onChange={e => setJerseyNumber(Math.max(1, Math.min(99, Number(e.target.value) || 19)))}
                />
              </label>
            </div>

            <div className="scanner-placement-box">
              <span>SQUAD PLACEMENT (13+ MAN ROSTER)</span>
              <div className="scanner-placement-pills">
                <button
                  type="button"
                  className={placement === 'starter' ? 'active' : ''}
                  onClick={() => setPlacement('starter')}
                >
                  <strong>Put in Starting XI</strong>
                  <small>Replaced starter moves to Bench</small>
                </button>
                <button
                  type="button"
                  className={placement === 'bench' ? 'active' : ''}
                  onClick={() => setPlacement('bench')}
                >
                  <strong>Add to Substitute Bench</strong>
                  <small>Available for tactical swaps</small>
                </button>
              </div>

              {placement === 'starter' && (
                <div className="scanner-replace-picker">
                  <span>CHOOSE STARTING POSITION TO TAKE OVER:</span>
                  <div className="scanner-starter-grid">
                    {starterNames.map(st => (
                      <button
                        key={st.index}
                        type="button"
                        className={replaceIdx === st.index ? 'active' : ''}
                        onClick={() => setReplaceIdx(st.index)}
                      >
                        <b>
                          #{st.number} {st.role}
                        </b>
                        <small>{st.name}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="scanner-sliders">
              <label className="range-field">
                <span>
                  <span>TACTICAL INTELLIGENCE (POSITIONING IQ)</span>
                  <b>{iq} IQ</b>
                </span>
                <input
                  type="range"
                  min="60"
                  max="99"
                  value={iq}
                  onChange={e => setIq(Number(e.target.value))}
                />
              </label>

              <label className="range-field">
                <span>
                  <span>ATHLETIC PHYSIQUE &amp; STRIDE</span>
                  <b>{size}%</b>
                </span>
                <input
                  type="range"
                  min="80"
                  max="125"
                  value={size}
                  onChange={e => setSize(Number(e.target.value))}
                />
              </label>

              <label className="range-field">
                <span>
                  <span>SHOT POWER</span>
                  <b>{power}</b>
                </span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={power}
                  onChange={e => setPower(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="scanner-dribble-box">
              <span>SIGNATURE SKILL MOVE</span>
              <div className="mini-option-grid cols-3">
                {DRIBBLE_OPTIONS.map(dr => (
                  <button
                    key={dr.id}
                    type="button"
                    className={dribble === dr.id ? 'active' : ''}
                    onClick={() => setDribble(dr.id)}
                  >
                    {dr.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="scanner-modal-footer">
              <button type="button" className="scanner-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="scanner-submit-btn" onClick={handleSubmit}>
                <Check size={16} />
                <span>
                  {placement === 'starter'
                    ? `ADD #${jerseyNumber} ${name.trim() || 'PLAYER'} TO STARTING XI`
                    : `ADD #${jerseyNumber} ${name.trim() || 'PLAYER'} TO BENCH`}
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
