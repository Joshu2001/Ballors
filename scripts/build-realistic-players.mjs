import fs from 'fs'
import path from 'path'
import { MeshoptSimplifier } from 'meshoptimizer'

const INNERSCENE_DIR = '/tmp/innerscene_assets'
const PROCESSED_TEX_DIR = '/tmp/innerscene_assets/processed'
const OUT_DIR = path.resolve('/app/applet/public/models/players')

// Standard 24-bone Humanoid Skeleton Hierarchy
const HUMANOID_BONES = [
  { name: 'Hips', parent: -1, mhJoint: 'root' },                // 0
  { name: 'Spine', parent: 0, mhJoint: 'spine05' },             // 1
  { name: 'Chest', parent: 1, mhJoint: 'spine03' },             // 2
  { name: 'UpperChest', parent: 2, mhJoint: 'spine01' },        // 3
  { name: 'Neck', parent: 3, mhJoint: 'neck01' },               // 4
  { name: 'Head', parent: 4, mhJoint: 'head' },                 // 5
  { name: 'LeftEye', parent: 5, mhJoint: 'eye.L' },             // 6
  { name: 'RightEye', parent: 5, mhJoint: 'eye.R' },            // 7
  { name: 'LeftShoulder', parent: 3, mhJoint: 'clavicle.L' },   // 8
  { name: 'LeftUpperArm', parent: 8, mhJoint: 'upperarm01.L' }, // 9
  { name: 'LeftLowerArm', parent: 9, mhJoint: 'lowerarm01.L' }, // 10
  { name: 'LeftHand', parent: 10, mhJoint: 'wrist.L' },         // 11
  { name: 'RightShoulder', parent: 3, mhJoint: 'clavicle.R' },  // 12
  { name: 'RightUpperArm', parent: 12, mhJoint: 'upperarm01.R' },// 13
  { name: 'RightLowerArm', parent: 13, mhJoint: 'lowerarm01.R' },// 14
  { name: 'RightHand', parent: 14, mhJoint: 'wrist.R' },        // 15
  { name: 'LeftUpperLeg', parent: 0, mhJoint: 'upperleg01.L' }, // 16
  { name: 'LeftLowerLeg', parent: 16, mhJoint: 'lowerleg01.L' },// 17
  { name: 'LeftFoot', parent: 17, mhJoint: 'foot.L' },          // 18
  { name: 'LeftToe', parent: 18, mhJoint: 'toe2-1.L' },         // 19
  { name: 'RightUpperLeg', parent: 0, mhJoint: 'upperleg01.R' },// 20
  { name: 'RightLowerLeg', parent: 20, mhJoint: 'lowerleg01.R' },// 21
  { name: 'RightFoot', parent: 21, mhJoint: 'foot.R' },         // 22
  { name: 'RightToe', parent: 22, mhJoint: 'toe2-1.R' },        // 23
]

const BONE_INDEX = Object.fromEntries(HUMANOID_BONES.map((b, i) => [b.name, i]))

function mapMakeHumanBoneToHumanoid(name) {
  if (name === 'root' || name === 'pelvis.L' || name === 'pelvis.R') return BONE_INDEX.Hips
  if (name === 'spine05' || name === 'spine04') return BONE_INDEX.Spine
  if (name === 'spine03' || name === 'spine02') return BONE_INDEX.Chest
  if (name === 'spine01' || name === 'breast.L' || name === 'breast.R') return BONE_INDEX.UpperChest
  if (name === 'neck01' || name === 'neck02' || name === 'neck03') return BONE_INDEX.Neck
  if (name === 'eye.L') return BONE_INDEX.LeftEye
  if (name === 'eye.R') return BONE_INDEX.RightEye
  if (name === 'clavicle.L' || name === 'shoulder01.L') return BONE_INDEX.LeftShoulder
  if (name === 'upperarm01.L' || name === 'upperarm02.L') return BONE_INDEX.LeftUpperArm
  if (name === 'lowerarm01.L' || name === 'lowerarm02.L') return BONE_INDEX.LeftLowerArm
  if (name === 'wrist.L' || (name.startsWith('metacarpal') && name.endsWith('.L')) || (name.startsWith('finger') && name.endsWith('.L'))) {
    return BONE_INDEX.LeftHand
  }
  if (name === 'clavicle.R' || name === 'shoulder01.R') return BONE_INDEX.RightShoulder
  if (name === 'upperarm01.R' || name === 'upperarm02.R') return BONE_INDEX.RightUpperArm
  if (name === 'lowerarm01.R' || name === 'lowerarm02.R') return BONE_INDEX.RightLowerArm
  if (name === 'wrist.R' || (name.startsWith('metacarpal') && name.endsWith('.R')) || (name.startsWith('finger') && name.endsWith('.R'))) {
    return BONE_INDEX.RightHand
  }
  if (name === 'upperleg01.L' || name === 'upperleg02.L') return BONE_INDEX.LeftUpperLeg
  if (name === 'lowerleg01.L' || name === 'lowerleg02.L') return BONE_INDEX.LeftLowerLeg
  if (name === 'foot.L') return BONE_INDEX.LeftFoot
  if (name.startsWith('toe') && name.endsWith('.L')) return BONE_INDEX.LeftToe
  if (name === 'upperleg01.R' || name === 'upperleg02.R') return BONE_INDEX.RightUpperLeg
  if (name === 'lowerleg01.R' || name === 'lowerleg02.R') return BONE_INDEX.RightLowerLeg
  if (name === 'foot.R') return BONE_INDEX.RightFoot
  if (name.startsWith('toe') && name.endsWith('.R')) return BONE_INDEX.RightToe
  return BONE_INDEX.Head
}

function parseGLB(filePath) {
  const buf = fs.readFileSync(filePath)
  const jsonLen = buf.readUInt32LE(12)
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'))
  const bin = buf.subarray(20 + jsonLen + 8)
  return { json, bin }
}

function getAccessorArray(json, bin, accIdx) {
  const acc = json.accessors[accIdx]
  const bv = json.bufferViews[acc.bufferView]
  const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0)
  const numComponents = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[acc.type]
  const count = acc.count * numComponents
  const slice = bin.subarray(byteOffset, byteOffset + bv.byteLength)
  const aligned = new Uint8Array(slice.byteLength)
  aligned.set(slice)
  if (acc.componentType === 5126) return new Float32Array(aligned.buffer, 0, count)
  if (acc.componentType === 5123) return new Uint16Array(aligned.buffer, 0, count)
  if (acc.componentType === 5125) return new Uint32Array(aligned.buffer, 0, count)
  if (acc.componentType === 5121) return new Uint8Array(aligned.buffer, 0, count)
  throw new Error(`Unsupported componentType ${acc.componentType}`)
}

function quatRotateVec(q, v) {
  const [qx, qy, qz, qw] = q
  const [vx, vy, vz] = v
  const ix = qw * vx + qy * vz - qz * vy
  const iy = qw * vy + qz * vx - qx * vz
  const iz = qw * vz + qx * vy - qy * vx
  const iw = -qx * vx - qy * vy - qz * vz
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ]
}

function eulerXYZToQuat(rx, ry, rz) {
  const cx = Math.cos(rx * 0.5), sx = Math.sin(rx * 0.5)
  const cy = Math.cos(ry * 0.5), sy = Math.sin(ry * 0.5)
  const cz = Math.cos(rz * 0.5), sz = Math.sin(rz * 0.5)
  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ]
}

function normalizeWeights4(pairs) {
  pairs.sort((a, b) => b[1] - a[1])
  const top = pairs.slice(0, 4)
  while (top.length < 4) top.push([0, 0])
  const sum = top[0][1] + top[1][1] + top[2][1] + top[3][1]
  if (sum <= 1e-6) {
    return { joints: [0, 0, 0, 0], weights: [1, 0, 0, 0] }
  }
  return {
    joints: [top[0][0], top[1][0], top[2][0], top[3][0]],
    weights: [top[0][1] / sum, top[1][1] / sum, top[2][1] / sum, top[3][1] / sum],
  }
}

// Extract primitive with world transform applied
function extractPrimitive(json, bin, meshIdx, primIdx, rootScale, rootTrans, nodeTrans = null, nodeRot = null) {
  const prim = json.meshes[meshIdx].primitives[primIdx]
  const rawPos = getAccessorArray(json, bin, prim.attributes.POSITION)
  const rawNorm = getAccessorArray(json, bin, prim.attributes.NORMAL)
  const rawUv = getAccessorArray(json, bin, prim.attributes.TEXCOORD_0)
  const rawIdx = getAccessorArray(json, bin, prim.indices)

  const vCount = rawPos.length / 3
  const pos = new Float32Array(vCount * 3)
  const norm = new Float32Array(vCount * 3)
  const uv = new Float32Array(rawUv)

  for (let i = 0; i < vCount; i++) {
    let vx = rawPos[i * 3]
    let vy = rawPos[i * 3 + 1]
    let vz = rawPos[i * 3 + 2]
    let nx = rawNorm[i * 3]
    let ny = rawNorm[i * 3 + 1]
    let nz = rawNorm[i * 3 + 2]

    if (nodeRot) {
      ;[vx, vy, vz] = quatRotateVec(nodeRot, [vx, vy, vz])
      ;[nx, ny, nz] = quatRotateVec(nodeRot, [nx, ny, nz])
    }
    if (nodeTrans) {
      vx += nodeTrans[0]
      vy += nodeTrans[1]
      vz += nodeTrans[2]
    }
    vx = vx * rootScale + rootTrans[0]
    vy = vy * rootScale + rootTrans[1]
    vz = vz * rootScale + rootTrans[2]

    const nLen = Math.hypot(nx, ny, nz) || 1
    pos[i * 3] = vx
    pos[i * 3 + 1] = vy
    pos[i * 3 + 2] = vz
    norm[i * 3] = nx / nLen
    norm[i * 3 + 1] = ny / nLen
    norm[i * 3 + 2] = nz / nLen
  }

  return {
    pos,
    norm,
    uv,
    indices: Uint32Array.from(rawIdx),
  }
}

// Compact a primitive after index filtering / MeshoptSimplifier
function compactPrimitive(prim, newIndices, jointsArr = null, weightsArr = null) {
  const remap = new Int32Array(prim.pos.length / 3).fill(-1)
  let nextVert = 0
  const outIndices = new Uint32Array(newIndices.length)
  for (let i = 0; i < newIndices.length; i++) {
    const oldV = newIndices[i]
    let newV = remap[oldV]
    if (newV === -1) {
      newV = nextVert++
      remap[oldV] = newV
    }
    outIndices[i] = newV
  }

  const pos = new Float32Array(nextVert * 3)
  const norm = new Float32Array(nextVert * 3)
  const uv = new Float32Array(nextVert * 2)
  const joints = jointsArr ? new Uint8Array(nextVert * 4) : null
  const weights = weightsArr ? new Float32Array(nextVert * 4) : null

  for (let oldV = 0; oldV < remap.length; oldV++) {
    const newV = remap[oldV]
    if (newV === -1) continue
    pos[newV * 3] = prim.pos[oldV * 3]
    pos[newV * 3 + 1] = prim.pos[oldV * 3 + 1]
    pos[newV * 3 + 2] = prim.pos[oldV * 3 + 2]
    norm[newV * 3] = prim.norm[oldV * 3]
    norm[newV * 3 + 1] = prim.norm[oldV * 3 + 1]
    norm[newV * 3 + 2] = prim.norm[oldV * 3 + 2]
    uv[newV * 2] = prim.uv[oldV * 2]
    uv[newV * 2 + 1] = prim.uv[oldV * 2 + 1]
    if (joints && jointsArr) {
      joints[newV * 4] = jointsArr[oldV * 4]
      joints[newV * 4 + 1] = jointsArr[oldV * 4 + 1]
      joints[newV * 4 + 2] = jointsArr[oldV * 4 + 2]
      joints[newV * 4 + 3] = jointsArr[oldV * 4 + 3]
    }
    if (weights && weightsArr) {
      weights[newV * 4] = weightsArr[oldV * 4]
      weights[newV * 4 + 1] = weightsArr[oldV * 4 + 1]
      weights[newV * 4 + 2] = weightsArr[oldV * 4 + 2]
      weights[newV * 4 + 3] = weightsArr[oldV * 4 + 3]
    }
  }

  return { pos, norm, uv, indices: outIndices, joints, weights }
}

function mergePrimitives(prims) {
  let totalVerts = 0
  let totalIdx = 0
  for (const p of prims) {
    totalVerts += p.pos.length / 3
    totalIdx += p.indices.length
  }
  const pos = new Float32Array(totalVerts * 3)
  const norm = new Float32Array(totalVerts * 3)
  const uv = new Float32Array(totalVerts * 2)
  const joints = new Uint8Array(totalVerts * 4)
  const weights = new Float32Array(totalVerts * 4)
  const indices = new Uint32Array(totalIdx)

  let vOff = 0
  let iOff = 0
  for (const p of prims) {
    const vCount = p.pos.length / 3
    pos.set(p.pos, vOff * 3)
    norm.set(p.norm, vOff * 3)
    uv.set(p.uv, vOff * 2)
    if (p.joints) joints.set(p.joints, vOff * 4)
    if (p.weights) weights.set(p.weights, vOff * 4)
    for (let i = 0; i < p.indices.length; i++) {
      indices[iOff + i] = p.indices[i] + vOff
    }
    vOff += vCount
    iOff += p.indices.length
  }
  return { pos, norm, uv, indices, joints, weights }
}

// Generate 8 rich skeletal AnimationClips for the 24-bone humanoid skeleton
function buildAnimations(bindPositions, variantIndex) {
  const hipsBind = bindPositions[BONE_INDEX.Hips]
  const L1 = bindPositions[BONE_INDEX.LeftUpperLeg][1] - bindPositions[BONE_INDEX.LeftLowerLeg][1] // ~0.413m
  const L2 = bindPositions[BONE_INDEX.LeftLowerLeg][1] - bindPositions[BONE_INDEX.LeftFoot][1]     // ~0.448m

  function stanceDrop(hipRx, kneeRx) {
    const legH = L1 * Math.cos(hipRx) + L2 * Math.cos(hipRx + kneeRx)
    return Math.max(0, (L1 + L2) - legH)
  }

  function sampleClip(name, duration, numSteps, poseFn) {
    const times = new Float32Array(numSteps)
    const tracks = new Map()
    for (let b = 0; b < HUMANOID_BONES.length; b++) {
      tracks.set(b, { rots: new Float32Array(numSteps * 4), trans: b === 0 ? new Float32Array(numSteps * 3) : null })
    }
    for (let s = 0; s < numSteps; s++) {
      const u = numSteps > 1 ? s / (numSteps - 1) : 0
      times[s] = u * duration
      // Guarantees loop continuity when u=1 wraps to u=0
      const phase = u * Math.PI * 2
      const pose = poseFn(u, phase)
      for (let b = 0; b < HUMANOID_BONES.length; b++) {
        const bName = HUMANOID_BONES[b].name
        const r = pose.rot[bName] || [0, 0, 0]
        const q = eulerXYZToQuat(r[0], r[1], r[2])
        const tr = tracks.get(b)
        tr.rots.set(q, s * 4)
        if (b === 0 && tr.trans) {
          const d = pose.hipsOffset || [0, 0, 0]
          tr.trans.set([hipsBind[0] + d[0], hipsBind[1] + d[1], hipsBind[2] + d[2]], s * 3)
        }
      }
    }
    return { name, times, tracks }
  }

  // 1. Idle (breathing + athletic micro-sway)
  const idleClip = sampleClip('Idle', 2.4, 17, (_u, ph) => {
    const breath = Math.sin(ph)
    const sway = Math.cos(ph)
    return {
      hipsOffset: [sway * 0.006, -0.008 + breath * 0.004, 0],
      rot: {
        Hips: [0.02, sway * 0.02, sway * 0.012],
        Spine: [0.02 + breath * 0.012, -sway * 0.015, -sway * 0.01],
        Chest: [0.02 + breath * 0.018, 0, 0],
        UpperChest: [breath * 0.012, 0, 0],
        Neck: [-0.015, sway * 0.03, 0],
        Head: [-0.01 - breath * 0.01, sway * 0.04, 0],
        LeftUpperArm: [0.04 + breath * 0.015, 0, 0.05],
        LeftLowerArm: [-0.18 - breath * 0.02, 0, 0],
        RightUpperArm: [0.04 - breath * 0.015, 0, -0.05],
        RightLowerArm: [-0.18 + breath * 0.02, 0, 0],
        LeftUpperLeg: [-0.05, 0, 0.015],
        LeftLowerLeg: [0.10, 0, 0],
        LeftFoot: [-0.05, 0, 0],
        RightUpperLeg: [-0.05, 0, -0.015],
        RightLowerLeg: [0.10, 0, 0],
        RightFoot: [-0.05, 0, 0],
      },
    }
  })

  // Helper for cyclic bipedal locomotion (Walk, Jog, Sprint)
  function makeGaitClip(name, duration, hipAmp, kneeBase, kneeSwingAmp, spineLean, armAmp, elbowBase) {
    return sampleClip(name, duration, 21, (_u, ph) => {
      const sL = Math.sin(ph)
      const cL = Math.cos(ph)
      const sR = -sL
      const cR = -cL

      // Left leg kinematics (negative rx = forward thigh flexion, positive rx = knee bend)
      const hipL = -sL * hipAmp - 0.06
      const kneeL = kneeBase + Math.max(0, -cL) * kneeSwingAmp + Math.max(0, sL) * 0.14
      const footL = -(hipL + kneeL) * (cL > 0 ? 0.85 : 0.35) + (sL < -0.3 ? 0.22 : 0)
      const toeL = sL < -0.2 ? -0.28 * sL : 0

      // Right leg kinematics
      const hipR = -sR * hipAmp - 0.06
      const kneeR = kneeBase + Math.max(0, -cR) * kneeSwingAmp + Math.max(0, sR) * 0.14
      const footR = -(hipR + kneeR) * (cR > 0 ? 0.85 : 0.35) + (sR < -0.3 ? 0.22 : 0)
      const toeR = sR < -0.2 ? -0.28 * sR : 0

      // Lock stance foot to turf via exact leg chain height
      const dropL = stanceDrop(hipL, kneeL)
      const dropR = stanceDrop(hipR, kneeR)
      const stanceY = -Math.min(dropL, dropR) + Math.abs(sL) * 0.018

      return {
        hipsOffset: [sL * 0.016, stanceY, 0],
        rot: {
          Hips: [spineLean * 0.35, -sL * 0.08, cL * 0.035],
          Spine: [spineLean * 0.35 + Math.abs(sL) * 0.02, sL * 0.06, -cL * 0.025],
          Chest: [spineLean * 0.30, sL * 0.07, 0],
          UpperChest: [0.03, sL * 0.04, 0],
          Neck: [-spineLean * 0.45, -sL * 0.05, 0],
          Head: [-spineLean * 0.40, -sL * 0.05, 0],
          LeftShoulder: [0, sL * 0.05, 0],
          LeftUpperArm: [sL * armAmp + 0.06, 0, 0.08],
          LeftLowerArm: [elbowBase - Math.max(0, -sL) * 0.32, 0, -0.06],
          LeftHand: [-0.08, 0, 0],
          RightShoulder: [0, -sL * 0.05, 0],
          RightUpperArm: [-sL * armAmp + 0.06, 0, -0.08],
          RightLowerArm: [elbowBase - Math.max(0, sL) * 0.32, 0, 0.06],
          RightHand: [-0.08, 0, 0],
          LeftUpperLeg: [hipL, 0, 0.015],
          LeftLowerLeg: [kneeL, 0, 0],
          LeftFoot: [footL, 0, 0],
          LeftToe: [toeL, 0, 0],
          RightUpperLeg: [hipR, 0, -0.015],
          RightLowerLeg: [kneeR, 0, 0],
          RightFoot: [footR, 0, 0],
          RightToe: [toeR, 0, 0],
        },
      }
    })
  }

  const walkClip = makeGaitClip('Walk', 1.05, 0.42, 0.12, 0.48, 0.06, 0.32, -0.35)
  const jogClip = makeGaitClip('Jog', 0.74, 0.68, 0.18, 0.82, 0.14, 0.56, -0.82)
  const sprintClip = makeGaitClip('Sprint', 0.54, 0.92, 0.22, 1.12, 0.24, 0.82, -1.08)

  // 5. Turn / Pivot step clip
  const turnClip = sampleClip('Turn', 0.65, 15, (_u, ph) => {
    const w = Math.sin(ph * 0.5)
    const hipL = -0.32 * w - 0.08
    const kneeL = 0.52 * w + 0.12
    const hipR = -0.22 * w - 0.08
    const kneeR = 0.42 * w + 0.12
    const drop = Math.min(stanceDrop(hipL, kneeL), stanceDrop(hipR, kneeR))
    return {
      hipsOffset: [w * 0.04, -drop, 0],
      rot: {
        Hips: [0.12 * w, w * 0.28, -w * 0.08],
        Spine: [0.10 * w, w * 0.18, -w * 0.06],
        Chest: [0.08 * w, w * 0.15, 0],
        Neck: [-0.08 * w, w * 0.22, 0],
        Head: [-0.06 * w, w * 0.25, 0],
        LeftUpperArm: [0.22 * w, 0, 0.28 * w + 0.06],
        LeftLowerArm: [-0.65 * w - 0.2, 0, 0],
        RightUpperArm: [-0.25 * w, 0, -0.28 * w - 0.06],
        RightLowerArm: [-0.55 * w - 0.2, 0, 0],
        LeftUpperLeg: [hipL, w * 0.18, 0.08 * w],
        LeftLowerLeg: [kneeL, 0, 0],
        LeftFoot: [-(hipL + kneeL), 0, 0],
        RightUpperLeg: [hipR, -w * 0.12, -0.08 * w],
        RightLowerLeg: [kneeR, 0, 0],
        RightFoot: [-(hipR + kneeR), 0, 0],
      },
    }
  })

  // 6. Kick (explosive strike with plant foot locked on turf)
  const kickClip = sampleClip('Kick', 0.60, 17, (u, _ph) => {
    // u in [0..0.35]: wind-up; u=0.55: impact & follow-through; u=1.0: recovery
    const windup = u < 0.35 ? Math.sin((u / 0.35) * Math.PI * 0.5) : Math.max(0, 1 - (u - 0.35) / 0.18)
    const strike = u >= 0.28 ? Math.sin(Math.min(1, (u - 0.28) / 0.72) * Math.PI) : 0

    const plantHipL = -0.28 * strike - 0.12 * windup - 0.05
    const plantKneeL = 0.42 * strike + 0.22 * windup + 0.10
    const kickHipR = 0.58 * windup - 1.15 * strike - 0.05
    const kickKneeR = 1.05 * windup + 0.15 * strike + 0.10
    const drop = stanceDrop(plantHipL, plantKneeL)

    return {
      hipsOffset: [-0.03 * strike, -drop, 0.04 * strike],
      rot: {
        Hips: [-0.14 * strike + 0.08 * windup, 0.26 * strike - 0.18 * windup, 0.08 * strike],
        Spine: [-0.08 * strike + 0.10 * windup, 0.18 * strike - 0.12 * windup, 0.06 * strike],
        Chest: [-0.06 * strike, 0.16 * strike - 0.12 * windup, 0],
        Neck: [0.12 * strike, -0.15 * strike, 0],
        Head: [0.14 * strike, -0.12 * strike, 0],
        LeftUpperArm: [-0.48 * strike + 0.25 * windup, 0, 0.42 * strike + 0.12],
        LeftLowerArm: [-0.45 - 0.35 * strike, 0, 0],
        RightUpperArm: [0.42 * strike - 0.30 * windup, 0, -0.22 * strike - 0.10],
        RightLowerArm: [-0.62 * strike - 0.25, 0, 0],
        LeftUpperLeg: [plantHipL, 0, 0.05],
        LeftLowerLeg: [plantKneeL, 0, 0],
        LeftFoot: [-(plantHipL + plantKneeL), 0, 0],
        RightUpperLeg: [kickHipR, 0, -0.06 * strike],
        RightLowerLeg: [kickKneeR, 0, 0],
        RightFoot: [0.42 * strike + 0.15 * windup, 0, 0],
      },
    }
  })

  // 7. SquadStand (Back-row pre-match lineup pose with individualized arm posture)
  const standStyle = variantIndex % 3
  const squadStandClip = sampleClip('SquadStand', 3.2, 17, (_u, ph) => {
    const b = Math.sin(ph)
    let armPose = {}
    if (standStyle === 0) {
      // Hands clasped behind back / athletic wide chest
      armPose = {
        LeftUpperArm: [0.22, -0.15, -0.08],
        LeftLowerArm: [-0.48, 0, -0.22],
        RightUpperArm: [0.22, 0.15, 0.08],
        RightLowerArm: [-0.48, 0, 0.22],
      }
    } else if (standStyle === 1) {
      // Hands on hips / confident defender posture
      armPose = {
        LeftUpperArm: [0.12, 0, 0.28],
        LeftLowerArm: [-0.78, 0.22, -0.35],
        RightUpperArm: [0.12, 0, -0.28],
        RightLowerArm: [-0.78, -0.22, 0.35],
      }
    } else {
      // Relaxed athletic ready stance
      armPose = {
        LeftUpperArm: [0.03 + b * 0.015, 0, 0.06],
        LeftLowerArm: [-0.22 - b * 0.02, 0, -0.05],
        RightUpperArm: [0.03 - b * 0.015, 0, -0.06],
        RightLowerArm: [-0.22 + b * 0.02, 0, 0.05],
      }
    }
    return {
      hipsOffset: [b * 0.004, -0.006 + b * 0.003, 0],
      rot: {
        Hips: [0.01, b * 0.015, 0],
        Spine: [-0.015 + b * 0.01, 0, 0],
        Chest: [-0.01 + b * 0.015, 0, 0],
        Neck: [0.01, -b * 0.02, 0],
        Head: [0.01, -b * 0.025, 0],
        ...armPose,
        LeftUpperLeg: [-0.04, 0, 0.025],
        LeftLowerLeg: [0.08, 0, 0],
        LeftFoot: [-0.04, 0, 0],
        RightUpperLeg: [-0.04, 0, -0.025],
        RightLowerLeg: [0.08, 0, 0],
        RightFoot: [-0.04, 0, 0],
      },
    }
  })

  // 8. SquadCrouch (Front-row half-squat / hands-on-knees Champions League photo pose)
  const squadCrouchClip = sampleClip('SquadCrouch', 3.2, 17, (_u, ph) => {
    const b = Math.sin(ph)
    // Symmetric athletic squat with hands resting on knees and feet flat on turf
    const hipL = -1.04 + b * 0.012
    const kneeL = 1.48 - b * 0.015
    const hipR = -0.98 + b * 0.012
    const kneeR = 1.42 - b * 0.015
    const drop = Math.max(stanceDrop(hipL, kneeL), stanceDrop(hipR, kneeR))
    return {
      hipsOffset: [0, -drop + 0.015, -0.04],
      rot: {
        Hips: [0.22, b * 0.012, 0],
        Spine: [0.12 + b * 0.01, 0, 0],
        Chest: [0.08 + b * 0.01, 0, 0],
        UpperChest: [0.04, 0, 0],
        Neck: [-0.24, 0, 0],
        Head: [-0.18 - b * 0.01, b * 0.02, 0],
        LeftShoulder: [0.08, 0, 0],
        LeftUpperArm: [-0.52, 0.12, -0.06],
        LeftLowerArm: [-0.38, 0, -0.14],
        LeftHand: [0.15, 0, 0],
        RightShoulder: [0.08, 0, 0],
        RightUpperArm: [-0.50, -0.12, 0.06],
        RightLowerArm: [-0.38, 0, 0.14],
        RightHand: [0.15, 0, 0],
        LeftUpperLeg: [hipL, 0.08, 0.06],
        LeftLowerLeg: [kneeL, 0, 0],
        LeftFoot: [-(hipL + kneeL), 0, 0],
        LeftToe: [0, 0, 0],
        RightUpperLeg: [hipR, -0.08, -0.06],
        RightLowerLeg: [kneeR, 0, 0],
        RightFoot: [-(hipR + kneeR), 0, 0],
        RightToe: [0, 0, 0],
      },
    }
  })

  return [idleClip, walkClip, jogClip, sprintClip, turnClip, kickClip, squadStandClip, squadCrouchClip]
}

// Morph head & hair slightly per player variant so the 12 squad models have authentic facial, cranial & physique variety
function morphPlayerGeometry(bodyPrim, hairPrim, variant) {
  const bPos = new Float32Array(bodyPrim.pos)
  const hPos = new Float32Array(hairPrim.pos)

  const { jawScale, cheekScale, noseBridgeZ, browY, shoulderScale, thighScale, hairMode } = variant
  for (let i = 0; i < bPos.length; i += 3) {
    let x = bPos[i]
    let y = bPos[i + 1]
    let z = bPos[i + 2]

    // Jawline & Cheekbone sculpting (y in 1.56..1.66, below the eye sockets y=1.674)
    if (y > 1.56 && y < 1.66 && z > 0.04) {
      const t = 1 - Math.abs(y - 1.61) / 0.05
      x *= 1 + (jawScale - 1) * t
    }
    if (y > 1.63 && y < 1.668 && z > 0.08) {
      const t = 1 - Math.abs(y - 1.65) / 0.02
      x *= 1 + (cheekScale - 1) * t
    }
    // Nose bridge & tip projection (strictly medial |x| < 0.018, below eye inner canthus y < 1.678)
    if (y > 1.63 && y < 1.678 && Math.abs(x) < 0.018 && z > 0.135) {
      z += noseBridgeZ
    }
    // Upper torso / shoulder breadth
    if (y > 1.15 && y < 1.50) {
      x *= shoulderScale
    }
    // Athletic thigh/calf muscle girth
    if (y > 0.18 && y < 0.88) {
      const sideCenter = x > 0 ? 0.135 : -0.135
      x = sideCenter + (x - sideCenter) * thighScale
    }

    bPos[i] = x
    bPos[i + 1] = y
    bPos[i + 2] = z
  }

  // Sculpt 3D hair strand volume per hairstyle (short-crop, textured-quiff, fade-curls, buzz, top-knot, dreads)
  const headCenter = [0, 1.69, 0.04]
  for (let i = 0; i < hPos.length; i += 3) {
    let x = hPos[i]
    let y = hPos[i + 1]
    let z = hPos[i + 2]
    const dx = x - headCenter[0]
    const dy = y - headCenter[1]
    const dz = z - headCenter[2]

    if (hairMode === 'buzz') {
      x = headCenter[0] + dx * 0.94
      y = headCenter[1] + dy * 0.91
      z = headCenter[2] + dz * 0.94
    } else if (hairMode === 'textured-quiff') {
      if (dy > 0.04 && dz > 0.02) {
        y += 0.024 * ((dy - 0.04) / 0.10)
        z += 0.016 * ((dz - 0.02) / 0.10)
      }
      x = headCenter[0] + dx * 0.97
    } else if (hairMode === 'fade-curls') {
      if (dy > 0.02) {
        x = headCenter[0] + dx * 1.07
        y += 0.018
        z = headCenter[2] + dz * 1.05
      } else {
        x = headCenter[0] + dx * 0.94
      }
    } else if (hairMode === 'dreads') {
      x = headCenter[0] + dx * 1.11
      y = headCenter[1] + dy * 1.06
      z = headCenter[2] + dz * 1.09
    } else if (hairMode === 'top-knot') {
      if (dy > 0.06 && dz < 0.04) {
        y += 0.032
        z -= 0.018
      }
    }

    hPos[i] = x
    hPos[i + 1] = y
    hPos[i + 2] = z
  }

  return {
    body: { ...bodyPrim, pos: bPos },
    hair: { ...hairPrim, pos: hPos },
  }
}

async function main() {
  await MeshoptSimplifier.ready
  fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('1. Loading CC0 MakeHuman Rigged Base Mesh and Clothed Soccer Player...')
  const rigged = parseGLB(path.join(INNERSCENE_DIR, 'male_base_rigged.glb'))
  const soccer = parseGLB(path.join(INNERSCENE_DIR, 'soccer_player_standing.glb'))

  // Extract 163-bone skin weights from male_base_rigged.glb and map to 24 humanoid bones
  const skinR = rigged.json.skins[0]
  const mhJointNames = skinR.joints.map(ji => rigged.json.nodes[ji].name)
  const mhToHumanoid = mhJointNames.map(mapMakeHumanBoneToHumanoid)

  // Read inverseBindMatrices from male_base_rigged.glb to get exact MakeHuman joint positions
  const ibmRaw = getAccessorArray(rigged.json, rigged.bin, skinR.inverseBindMatrices)
  const mhJointPosR = {}
  for (let idx = 0; idx < skinR.joints.length; idx++) {
    const m = ibmRaw.subarray(idx * 16, idx * 16 + 16)
    const r00 = m[0], r10 = m[1], r20 = m[2]
    const r01 = m[4], r11 = m[5], r21 = m[6]
    const r02 = m[8], r12 = m[9], r22 = m[10]
    const tx = m[12], ty = m[13], tz = m[14]
    mhJointPosR[mhJointNames[idx]] = [
      -(r00 * tx + r10 * ty + r20 * tz),
      -(r01 * tx + r11 * ty + r21 * tz),
      -(r02 * tx + r12 * ty + r22 * tz),
    ]
  }

  // Extract rigged body vertices, UVs, and 24-bone aggregated weights
  const rPrim0 = rigged.json.meshes[0].primitives[0]
  const posR = getAccessorArray(rigged.json, rigged.bin, rPrim0.attributes.POSITION)
  const uvR = getAccessorArray(rigged.json, rigged.bin, rPrim0.attributes.TEXCOORD_0)
  const jointsR = getAccessorArray(rigged.json, rigged.bin, rPrim0.attributes.JOINTS_0)
  const weightsR = getAccessorArray(rigged.json, rigged.bin, rPrim0.attributes.WEIGHTS_0)
  const vCountR = posR.length / 3

  const humanoidJointsR = new Uint8Array(vCountR * 4)
  const humanoidWeightsR = new Float32Array(vCountR * 4)
  const uvMapR = new Map()

  for (let i = 0; i < vCountR; i++) {
    const agg = new Map()
    for (let k = 0; k < 4; k++) {
      const mhJ = jointsR[i * 4 + k]
      const w = weightsR[i * 4 + k]
      if (w > 1e-5) {
        const hj = mhToHumanoid[mhJ]
        agg.set(hj, (agg.get(hj) || 0) + w)
      }
    }
    const norm = normalizeWeights4(Array.from(agg.entries()))
    humanoidJointsR.set(norm.joints, i * 4)
    humanoidWeightsR.set(norm.weights, i * 4)

    const uk = `${Math.round(uvR[i * 2] * 100000)},${Math.round(uvR[i * 2 + 1] * 100000)}`
    uvMapR.set(uk, i)
  }

  // Extract Micah body in world space (root node 25 scale & translation)
  const rootScale = 1.1597435474395752
  const rootTrans = [0, 0.02748807705938816, 0]
  const micahBodyRaw = extractPrimitive(soccer.json, soccer.bin, 19, 0, rootScale, rootTrans)
  const vCountS = micahBodyRaw.pos.length / 3

  // Match UV pairs between Rigged and Micah to map joint pivots & full 63,750-vertex body surface into Micah space
  const matchedPairs = []
  for (let i = 0; i < vCountS; i++) {
    const uk = `${Math.round(micahBodyRaw.uv[i * 2] * 100000)},${Math.round(micahBodyRaw.uv[i * 2 + 1] * 100000)}`
    const ri = uvMapR.get(uk)
    if (ri !== undefined) {
      matchedPairs.push({
        pr: [posR[ri * 3], posR[ri * 3 + 1], posR[ri * 3 + 2]],
        ps: [micahBodyRaw.pos[i * 3], micahBodyRaw.pos[i * 3 + 1], micahBodyRaw.pos[i * 3 + 2]],
        ri,
      })
    }
  }
  console.log(`   Matched ${matchedPairs.length} / ${vCountS} UV vertices between Rigged base and Micah soccer player.`)

  // Subsample matched pairs for fast spatial displacement queries
  const sparsePairs = matchedPairs.filter((_, idx) => idx % 8 === 0)
  function mapRiggedPointToMicah(ptR) {
    let best = []
    for (let i = 0; i < sparsePairs.length; i++) {
      const p = sparsePairs[i].pr
      const d2 = (p[0] - ptR[0]) ** 2 + (p[1] - ptR[1]) ** 2 + (p[2] - ptR[2]) ** 2
      if (best.length < 12) {
        best.push({ d2, pair: sparsePairs[i] })
        best.sort((a, b) => a.d2 - b.d2)
      } else if (d2 < best[11].d2) {
        best[11] = { d2, pair: sparsePairs[i] }
        best.sort((a, b) => a.d2 - b.d2)
      }
    }
    let wSum = 0, dx = 0, dy = 0, dz = 0
    for (const item of best) {
      const w = 1 / (item.d2 + 1e-5)
      wSum += w
      dx += w * (item.pair.ps[0] - item.pair.pr[0])
      dy += w * (item.pair.ps[1] - item.pair.pr[1])
      dz += w * (item.pair.ps[2] - item.pair.pr[2])
    }
    return [ptR[0] + dx / wSum, ptR[1] + dy / wSum, ptR[2] + dz / wSum]
  }

  // Compute exact 24 humanoid bone world bind positions in Micah space
  const bindPositions = HUMANOID_BONES.map(b => mapRiggedPointToMicah(mhJointPosR[b.mhJoint]))

  // Build spatial reference cloud of rigged vertices mapped into Micah space for clothing weight transfer
  const refCloud = []
  for (let i = 0; i < vCountR; i += 4) {
    const ptR = [posR[i * 3], posR[i * 3 + 1], posR[i * 3 + 2]]
    const ptM = mapRiggedPointToMicah(ptR)
    refCloud.push({
      pos: ptM,
      joints: [humanoidJointsR[i * 4], humanoidJointsR[i * 4 + 1], humanoidJointsR[i * 4 + 2], humanoidJointsR[i * 4 + 3]],
      weights: [humanoidWeightsR[i * 4], humanoidWeightsR[i * 4 + 1], humanoidWeightsR[i * 4 + 2], humanoidWeightsR[i * 4 + 3]],
    })
  }

  function transferWeightsFromCloud(posArray, allowedBonesSet = null) {
    const count = posArray.length / 3
    const outJ = new Uint8Array(count * 4)
    const outW = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      const vx = posArray[i * 3], vy = posArray[i * 3 + 1], vz = posArray[i * 3 + 2]
      let top = []
      for (let c = 0; c < refCloud.length; c++) {
        const cp = refCloud[c].pos
        const d2 = (cp[0] - vx) ** 2 + (cp[1] - vy) ** 2 + (cp[2] - vz) ** 2
        if (top.length < 6) {
          top.push({ d2, item: refCloud[c] })
          top.sort((a, b) => a.d2 - b.d2)
        } else if (d2 < top[5].d2) {
          top[5] = { d2, item: refCloud[c] }
          top.sort((a, b) => a.d2 - b.d2)
        }
      }
      const agg = new Map()
      for (const t of top) {
        const distW = 1 / (Math.sqrt(t.d2) + 0.004)
        for (let k = 0; k < 4; k++) {
          const jb = t.item.joints[k]
          if (allowedBonesSet && !allowedBonesSet.has(jb)) continue
          const wb = t.item.weights[k] * distW
          if (wb > 1e-5) agg.set(jb, (agg.get(jb) || 0) + wb)
        }
      }
      const norm = normalizeWeights4(Array.from(agg.entries()))
      outJ.set(norm.joints, i * 4)
      outW.set(norm.weights, i * 4)
    }
    return { joints: outJ, weights: outW }
  }

  // Assign skin weights to Micah body (Mesh 19)
  const bodyJointsRaw = new Uint8Array(vCountS * 4)
  const bodyWeightsRaw = new Float32Array(vCountS * 4)
  for (let i = 0; i < vCountS; i++) {
    const uk = `${Math.round(micahBodyRaw.uv[i * 2] * 100000)},${Math.round(micahBodyRaw.uv[i * 2 + 1] * 100000)}`
    const ri = uvMapR.get(uk)
    if (ri !== undefined) {
      bodyJointsRaw.set(humanoidJointsR.subarray(ri * 4, ri * 4 + 4), i * 4)
      bodyWeightsRaw.set(humanoidWeightsR.subarray(ri * 4, ri * 4 + 4), i * 4)
    } else {
      const single = transferWeightsFromCloud(micahBodyRaw.pos.subarray(i * 3, i * 3 + 3))
      bodyJointsRaw.set(single.joints, i * 4)
      bodyWeightsRaw.set(single.weights, i * 4)
    }
  }

  // Filter out hidden interior shin/foot triangles (< 0.495m Y and |X| < 0.22m)
  // Keep anterior facial features (eyes, eyelids, nose, lips, ears: y >= 1.53 && z >= 0.03) 100% un-simplified
  // so eyelids never collapse across eyeballs or bury eyebrows/eyelashes!
  const anteriorFaceIdx = []
  const craniumIdx = []
  const limbIdx = []
  for (let i = 0; i < micahBodyRaw.indices.length; i += 3) {
    const a = micahBodyRaw.indices[i], b = micahBodyRaw.indices[i + 1], c = micahBodyRaw.indices[i + 2]
    const ya = micahBodyRaw.pos[a * 3 + 1], yb = micahBodyRaw.pos[b * 3 + 1], yc = micahBodyRaw.pos[c * 3 + 1]
    const xa = micahBodyRaw.pos[a * 3], xb = micahBodyRaw.pos[b * 3], xc = micahBodyRaw.pos[c * 3]
    const za = micahBodyRaw.pos[a * 3 + 2], zb = micahBodyRaw.pos[b * 3 + 2], zc = micahBodyRaw.pos[c * 3 + 2]
    // Skip hidden skin inside socks & cleats
    if (ya < 0.495 && yb < 0.495 && yc < 0.495 && Math.abs(xa) < 0.22 && Math.abs(xb) < 0.22 && Math.abs(xc) < 0.22) {
      continue
    }
    if ((ya >= 1.54 || yb >= 1.54 || yc >= 1.54) && (za >= 0.05 || zb >= 0.05 || zc >= 0.05)) {
      anteriorFaceIdx.push(a, b, c)
    } else if (ya >= 1.46 || yb >= 1.46 || yc >= 1.46) {
      craniumIdx.push(a, b, c)
    } else {
      limbIdx.push(a, b, c)
    }
  }

  const [sCranium] = MeshoptSimplifier.simplify(
    Uint32Array.from(craniumIdx),
    micahBodyRaw.pos,
    3,
    Math.floor((craniumIdx.length * 0.28) / 3) * 3,
    0.004,
    ['LockBorder']
  )
  const [sLimb] = MeshoptSimplifier.simplify(
    Uint32Array.from(limbIdx),
    micahBodyRaw.pos,
    3,
    Math.floor((limbIdx.length * 0.14) / 3) * 3,
    0.015,
    ['LockBorder']
  )
  const combinedBodyIdx = new Uint32Array(anteriorFaceIdx.length + sCranium.length + sLimb.length)
  combinedBodyIdx.set(anteriorFaceIdx, 0)
  combinedBodyIdx.set(sCranium, anteriorFaceIdx.length)
  combinedBodyIdx.set(sLimb, anteriorFaceIdx.length + sCranium.length)
  const baseBodyPrim = compactPrimitive(micahBodyRaw, combinedBodyIdx, bodyJointsRaw, bodyWeightsRaw)
  console.log(`   Body primitive compacted: ${baseBodyPrim.pos.length / 3} verts, ${baseBodyPrim.indices.length / 3} tris`)

  // 2. Soccer Jersey (Mesh 18 Prim 0) & Shorts (Mesh 18 Prim 1)
  const jerseyRaw = extractPrimitive(soccer.json, soccer.bin, 18, 0, rootScale, rootTrans)
  const [jerseyIdx] = MeshoptSimplifier.simplify(
    jerseyRaw.indices,
    jerseyRaw.pos,
    3,
    Math.floor((jerseyRaw.indices.length * 0.22) / 3) * 3,
    0.012,
    ['LockBorder']
  )
  const jerseyAllowed = new Set([
    BONE_INDEX.Hips, BONE_INDEX.Spine, BONE_INDEX.Chest, BONE_INDEX.UpperChest, BONE_INDEX.Neck,
    BONE_INDEX.LeftShoulder, BONE_INDEX.LeftUpperArm, BONE_INDEX.LeftLowerArm,
    BONE_INDEX.RightShoulder, BONE_INDEX.RightUpperArm, BONE_INDEX.RightLowerArm,
  ])
  const jerseyWeights = transferWeightsFromCloud(jerseyRaw.pos, jerseyAllowed)
  // Offset jersey 1.5mm outward along normal to prevent skin poke-through
  for (let i = 0; i < jerseyRaw.pos.length; i++) jerseyRaw.pos[i] += jerseyRaw.norm[i] * 0.0015
  const jerseyPrim = compactPrimitive(jerseyRaw, jerseyIdx, jerseyWeights.joints, jerseyWeights.weights)

  const shortsRaw = extractPrimitive(soccer.json, soccer.bin, 18, 1, rootScale, rootTrans)
  const [shortsIdx] = MeshoptSimplifier.simplify(
    shortsRaw.indices,
    shortsRaw.pos,
    3,
    Math.floor((shortsRaw.indices.length * 0.22) / 3) * 3,
    0.012,
    ['LockBorder']
  )
  const shortsAllowed = new Set([
    BONE_INDEX.Hips, BONE_INDEX.Spine, BONE_INDEX.LeftUpperLeg, BONE_INDEX.RightUpperLeg,
    BONE_INDEX.LeftLowerLeg, BONE_INDEX.RightLowerLeg,
  ])
  const shortsWeights = transferWeightsFromCloud(shortsRaw.pos, shortsAllowed)
  for (let i = 0; i < shortsRaw.pos.length; i++) shortsRaw.pos[i] += shortsRaw.norm[i] * 0.0015
  const shortsPrim = compactPrimitive(shortsRaw, shortsIdx, shortsWeights.joints, shortsWeights.weights)

  // 3. Athletic Socks (Mesh 0 Left + Mesh 1 Right)
  const sockLRaw = extractPrimitive(soccer.json, soccer.bin, 0, 0, rootScale, rootTrans)
  const [sockLIdx] = MeshoptSimplifier.simplify(
    sockLRaw.indices,
    sockLRaw.pos,
    3,
    Math.floor((sockLRaw.indices.length * 0.2) / 3) * 3,
    0.012,
    ['LockBorder']
  )
  const sockLWeights = transferWeightsFromCloud(
    sockLRaw.pos,
    new Set([BONE_INDEX.LeftUpperLeg, BONE_INDEX.LeftLowerLeg, BONE_INDEX.LeftFoot])
  )
  const sockLComp = compactPrimitive(sockLRaw, sockLIdx, sockLWeights.joints, sockLWeights.weights)

  const sockRRaw = extractPrimitive(soccer.json, soccer.bin, 1, 0, rootScale, rootTrans)
  const [sockRIdx] = MeshoptSimplifier.simplify(
    sockRRaw.indices,
    sockRRaw.pos,
    3,
    Math.floor((sockRRaw.indices.length * 0.2) / 3) * 3,
    0.012,
    ['LockBorder']
  )
  const sockRWeights = transferWeightsFromCloud(
    sockRRaw.pos,
    new Set([BONE_INDEX.RightUpperLeg, BONE_INDEX.RightLowerLeg, BONE_INDEX.RightFoot])
  )
  const sockRComp = compactPrimitive(sockRRaw, sockRIdx, sockRWeights.joints, sockRWeights.weights)
  const socksPrim = mergePrimitives([sockLComp, sockRComp])

  // 4. Soccer Cleats (Mesh 20 shoes06 + Meshes 2..13 Cleat sole studs)
  const shoesRaw = extractPrimitive(soccer.json, soccer.bin, 20, 0, rootScale, rootTrans)
  const [shoesIdx] = MeshoptSimplifier.simplify(
    shoesRaw.indices,
    shoesRaw.pos,
    3,
    Math.floor((shoesRaw.indices.length * 0.22) / 3) * 3,
    0.012,
    ['LockBorder']
  )
  const studPrims = [compactPrimitive(shoesRaw, shoesIdx)]
  for (let mi = 2; mi <= 13; mi++) {
    const node = soccer.json.nodes[mi]
    const studRaw = extractPrimitive(soccer.json, soccer.bin, mi, 0, rootScale, rootTrans, node.translation, node.rotation)
    const [sIdx] = MeshoptSimplifier.simplify(
      studRaw.indices,
      studRaw.pos,
      3,
      Math.floor((studRaw.indices.length * 0.25) / 3) * 3,
      0.015
    )
    studPrims.push(compactPrimitive(studRaw, sIdx))
  }
  const mergedShoes = mergePrimitives(studPrims)
  const shoeCount = mergedShoes.pos.length / 3
  const shoeJ = new Uint8Array(shoeCount * 4)
  const shoeW = new Float32Array(shoeCount * 4)
  for (let i = 0; i < shoeCount; i++) {
    const x = mergedShoes.pos[i * 3], z = mergedShoes.pos[i * 3 + 2]
    const isLeft = x >= 0
    const footBone = isLeft ? BONE_INDEX.LeftFoot : BONE_INDEX.RightFoot
    const toeBone = isLeft ? BONE_INDEX.LeftToe : BONE_INDEX.RightToe
    const toeBlend = Math.max(0, Math.min(1, (z - 0.13) / 0.08))
    shoeJ.set([footBone, toeBone, 0, 0], i * 4)
    shoeW.set([1 - toeBlend, toeBlend, 0, 0], i * 4)
  }
  mergedShoes.joints = shoeJ
  mergedShoes.weights = shoeW

  // 5. Hair (Mesh 21 short01 simplified) — bound 100% to Head (5)
  const hairRaw = extractPrimitive(soccer.json, soccer.bin, 21, 0, rootScale, rootTrans)
  const [hairIdx] = MeshoptSimplifier.simplify(
    hairRaw.indices,
    hairRaw.pos,
    3,
    Math.floor((hairRaw.indices.length * 0.48) / 3) * 3,
    0.008,
    ['LockBorder']
  )
  const hairVCount = hairRaw.pos.length / 3
  const hairJ = new Uint8Array(hairVCount * 4)
  const hairW = new Float32Array(hairVCount * 4)
  for (let i = 0; i < hairVCount; i++) {
    hairJ[i * 4] = BONE_INDEX.Head
    hairW[i * 4] = 1.0
  }
  const baseHairPrim = compactPrimitive(hairRaw, hairIdx, hairJ, hairW)

  // 6. Eyeballs (Mesh 17 low-poly) — bound to Head (5) so eyelids & eyeballs move identically
  const eyesRaw = extractPrimitive(soccer.json, soccer.bin, 17, 0, rootScale, rootTrans)
  const eyesVCount = eyesRaw.pos.length / 3
  const eyesJ = new Uint8Array(eyesVCount * 4)
  const eyesW = new Float32Array(eyesVCount * 4)
  for (let i = 0; i < eyesVCount; i++) {
    eyesJ[i * 4] = BONE_INDEX.Head
    eyesW[i * 4] = 1.0
  }
  const eyesPrim = compactPrimitive(eyesRaw, eyesRaw.indices, eyesJ, eyesW)

  // 7. Eyebrows (Mesh 14) & Eyelashes (Mesh 15) — bound 100% to Head (5) with slight normal offset
  const browRaw = extractPrimitive(soccer.json, soccer.bin, 14, 0, rootScale, rootTrans)
  for (let i = 0; i < browRaw.pos.length; i += 3) {
    browRaw.pos[i + 2] += 0.0012
  }
  const browVCount = browRaw.pos.length / 3
  const browJ = new Uint8Array(browVCount * 4)
  const browW = new Float32Array(browVCount * 4)
  for (let i = 0; i < browVCount; i++) {
    browJ[i * 4] = BONE_INDEX.Head
    browW[i * 4] = 1.0
  }
  const browPrim = compactPrimitive(browRaw, browRaw.indices, browJ, browW)

  const lashRaw = extractPrimitive(soccer.json, soccer.bin, 15, 0, rootScale, rootTrans)
  for (let i = 0; i < lashRaw.pos.length; i += 3) {
    lashRaw.pos[i + 2] += 0.0008
  }
  const lashVCount = lashRaw.pos.length / 3
  const lashJ = new Uint8Array(lashVCount * 4)
  const lashW = new Float32Array(lashVCount * 4)
  for (let i = 0; i < lashVCount; i++) {
    lashJ[i * 4] = BONE_INDEX.Head
    lashW[i * 4] = 1.0
  }
  const lashPrim = compactPrimitive(lashRaw, lashRaw.indices, lashJ, lashW)

  // Player roster variants matching PRESET_SQUAD_APPEARANCES
  const PLAYER_VARIANTS = [
    { file: 'goalkeeper.glb', skin: 'skin_olive.jpg', hair: 'hair_brown.png', eye: 'eye_hazel.jpg', kit: 'kit_gk.jpg', hairMode: 'textured-quiff', jawScale: 1.02, cheekScale: 1.01, noseBridgeZ: 0.002, browY: 0.001, shoulderScale: 1.04, thighScale: 1.03 },
    { file: 'outfield-1.glb', skin: 'skin_olive.jpg', hair: 'hair_brown.png', eye: 'eye_hazel.jpg', kit: 'kit_1.jpg', hairMode: 'short-crop', jawScale: 1.00, cheekScale: 1.00, noseBridgeZ: 0.001, browY: 0.000, shoulderScale: 1.00, thighScale: 1.01 },
    { file: 'outfield-2.glb', skin: 'skin_bronze.jpg', hair: 'hair_dark.png', eye: 'eye_brown.jpg', kit: 'kit_2.jpg', hairMode: 'dreads', jawScale: 1.04, cheekScale: 1.02, noseBridgeZ: 0.002, browY: 0.002, shoulderScale: 1.05, thighScale: 1.05 },
    { file: 'outfield-3.glb', skin: 'skin_olive.jpg', hair: 'hair_brown.png', eye: 'eye_brown.jpg', kit: 'kit_3.jpg', hairMode: 'short-crop', jawScale: 1.05, cheekScale: 1.02, noseBridgeZ: 0.000, browY: 0.001, shoulderScale: 1.04, thighScale: 1.04 },
    { file: 'outfield-4.glb', skin: 'skin_fair.jpg', hair: 'hair_brown.png', eye: 'eye_blue.jpg', kit: 'kit_4.jpg', hairMode: 'textured-quiff', jawScale: 0.98, cheekScale: 0.99, noseBridgeZ: -0.001, browY: 0.000, shoulderScale: 0.98, thighScale: 0.99 },
    { file: 'outfield-5.glb', skin: 'skin_mahogany.jpg', hair: 'hair_dark.png', eye: 'eye_brown.jpg', kit: 'kit_5.jpg', hairMode: 'fade-curls', jawScale: 0.99, cheekScale: 1.01, noseBridgeZ: 0.002, browY: 0.001, shoulderScale: 1.01, thighScale: 1.02 },
    { file: 'outfield-6.glb', skin: 'skin_tan.jpg', hair: 'hair_dark.png', eye: 'eye_hazel.jpg', kit: 'kit_6.jpg', hairMode: 'buzz', jawScale: 1.03, cheekScale: 1.02, noseBridgeZ: 0.001, browY: 0.002, shoulderScale: 1.02, thighScale: 1.02 },
    { file: 'outfield-7.glb', skin: 'skin_olive.jpg', hair: 'hair_dark.png', eye: 'eye_brown.jpg', kit: 'kit_7.jpg', hairMode: 'short-crop', jawScale: 0.97, cheekScale: 0.98, noseBridgeZ: -0.001, browY: -0.001, shoulderScale: 0.97, thighScale: 0.98 },
    { file: 'outfield-8.glb', skin: 'skin_fair.jpg', hair: 'hair_blonde.png', eye: 'eye_blue.jpg', kit: 'kit_8.jpg', hairMode: 'textured-quiff', jawScale: 0.98, cheekScale: 0.99, noseBridgeZ: -0.002, browY: 0.000, shoulderScale: 0.96, thighScale: 0.98 },
    { file: 'outfield-9.glb', skin: 'skin_mahogany.jpg', hair: 'hair_blonde.png', eye: 'eye_brown.jpg', kit: 'kit_9.jpg', hairMode: 'fade-curls', jawScale: 0.97, cheekScale: 1.00, noseBridgeZ: 0.001, browY: 0.001, shoulderScale: 1.02, thighScale: 1.03 },
    { file: 'outfield-10.glb', skin: 'skin_tan.jpg', hair: 'hair_dark.png', eye: 'eye_brown.jpg', kit: 'kit_10.jpg', hairMode: 'dreads', jawScale: 1.02, cheekScale: 1.01, noseBridgeZ: 0.001, browY: 0.002, shoulderScale: 1.00, thighScale: 1.01 },
    { file: 'outfield-11.glb', skin: 'skin_espresso.jpg', hair: 'hair_dark.png', eye: 'eye_brown.jpg', kit: 'kit_11.jpg', hairMode: 'top-knot', jawScale: 1.03, cheekScale: 1.02, noseBridgeZ: 0.003, browY: 0.001, shoulderScale: 1.03, thighScale: 1.04 },
  ]

  // Shared normal & accessory textures
  const skinNormalBytes = fs.readFileSync(path.join(PROCESSED_TEX_DIR, 'skin_normal.jpg'))
  const kitNormalBytes = fs.readFileSync(path.join(PROCESSED_TEX_DIR, 'kit_normal.jpg'))
  const socksDiffuseBytes = fs.readFileSync(path.join(PROCESSED_TEX_DIR, 'socks_diffuse.jpg'))
  const bootsDiffuseBytes = fs.readFileSync(path.join(PROCESSED_TEX_DIR, 'boots_diffuse.jpg'))
  const bootsNormalBytes = fs.readFileSync(path.join(PROCESSED_TEX_DIR, 'boots_normal.jpg'))
  const eyebrowBytes = fs.readFileSync(path.join(PROCESSED_TEX_DIR, 'eyebrow.png'))
  const eyelashesBytes = fs.readFileSync(path.join(PROCESSED_TEX_DIR, 'eyelashes.png'))

  for (let vi = 0; vi < PLAYER_VARIANTS.length; vi++) {
    const variant = PLAYER_VARIANTS[vi]
    const morphed = morphPlayerGeometry(baseBodyPrim, baseHairPrim, variant)
    const animations = buildAnimations(bindPositions, vi)

    const outPath = path.join(OUT_DIR, variant.file)
    writeRiggedGLB({
      outPath,
      bindPositions,
      primitives: [
        { name: 'Body_Skin', data: morphed.body, matIndex: 0 },
        { name: 'Kit_Jersey', data: jerseyPrim, matIndex: 1 },
        { name: 'Kit_Shorts', data: shortsPrim, matIndex: 2 },
        { name: 'Kit_Socks', data: socksPrim, matIndex: 3 },
        { name: 'Footwear_Cleats', data: mergedShoes, matIndex: 4 },
        { name: 'Head_Hair', data: morphed.hair, matIndex: 5 },
        { name: 'Head_Eyes', data: eyesPrim, matIndex: 6 },
        { name: 'Head_Brows', data: browPrim, matIndex: 7 },
        { name: 'Head_Lashes', data: lashPrim, matIndex: 8 },
      ],
      textures: [
        { name: 'skin_diffuse', mime: 'image/jpeg', bytes: fs.readFileSync(path.join(PROCESSED_TEX_DIR, variant.skin)) }, // 0
        { name: 'skin_normal', mime: 'image/jpeg', bytes: skinNormalBytes },                                              // 1
        { name: 'kit_diffuse', mime: 'image/jpeg', bytes: fs.readFileSync(path.join(PROCESSED_TEX_DIR, variant.kit)) },   // 2
        { name: 'kit_normal', mime: 'image/jpeg', bytes: kitNormalBytes },                                                // 3
        { name: 'socks_diffuse', mime: 'image/jpeg', bytes: socksDiffuseBytes },                                          // 4
        { name: 'boots_diffuse', mime: 'image/jpeg', bytes: bootsDiffuseBytes },                                          // 5
        { name: 'boots_normal', mime: 'image/jpeg', bytes: bootsNormalBytes },                                            // 6
        { name: 'hair_diffuse', mime: 'image/png', bytes: fs.readFileSync(path.join(PROCESSED_TEX_DIR, variant.hair)) },  // 7
        { name: 'eye_diffuse', mime: 'image/jpeg', bytes: fs.readFileSync(path.join(PROCESSED_TEX_DIR, variant.eye)) },   // 8
        { name: 'brow_diffuse', mime: 'image/png', bytes: eyebrowBytes },                                                 // 9
        { name: 'lash_diffuse', mime: 'image/png', bytes: eyelashesBytes },                                               // 10
      ],
      animations,
    })
  }
}

function writeRiggedGLB({ outPath, bindPositions, primitives, textures, animations }) {
  const bufferViews = []
  const accessors = []
  const chunks = []
  let byteOffset = 0

  function appendBuffer(typedArrayOrBuffer, target = undefined) {
    const buf = Buffer.isBuffer(typedArrayOrBuffer)
      ? typedArrayOrBuffer
      : Buffer.from(typedArrayOrBuffer.buffer, typedArrayOrBuffer.byteOffset, typedArrayOrBuffer.byteLength)
    const pad = (4 - (buf.length % 4)) % 4
    const padded = pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf
    const bvIndex = bufferViews.length
    const bv = { buffer: 0, byteOffset, byteLength: buf.length }
    if (target !== undefined) bv.target = target
    bufferViews.push(bv)
    chunks.push(padded)
    byteOffset += padded.length
    return bvIndex
  }

  function addAccessor(typedArray, componentType, count, type, target = undefined, computeMinMax = false) {
    const bvIndex = appendBuffer(typedArray, target)
    const acc = { bufferView: bvIndex, componentType, count, type }
    if (computeMinMax && count > 0) {
      const dim = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type]
      const min = new Array(dim).fill(Infinity)
      const max = new Array(dim).fill(-Infinity)
      for (let i = 0; i < count; i++) {
        for (let d = 0; d < dim; d++) {
          const v = typedArray[i * dim + d]
          if (v < min[d]) min[d] = v
          if (v > max[d]) max[d] = v
        }
      }
      acc.min = min
      acc.max = max
    }
    const idx = accessors.length
    accessors.push(acc)
    return idx
  }

  // Node layout:
  // Node 0: CharacterRoot (contains child 1 = SkinnedMesh node, child 2 = Hips bone root)
  // Node 1: FootballerMesh (mesh: 0, skin: 0)
  // Nodes 2..25: 24 Humanoid Bones (index = 2 + boneIdx)
  const nodes = [
    { name: 'FootballerRoot', children: [1, 2] },
    { name: 'FootballerSkinnedMesh', mesh: 0, skin: 0 },
  ]

  for (let b = 0; b < HUMANOID_BONES.length; b++) {
    const bone = HUMANOID_BONES[b]
    const pos = bindPositions[b]
    const parentPos = bone.parent >= 0 ? bindPositions[bone.parent] : [0, 0, 0]
    const localT = [pos[0] - parentPos[0], pos[1] - parentPos[1], pos[2] - parentPos[2]]
    const children = []
    for (let c = 0; c < HUMANOID_BONES.length; c++) {
      if (HUMANOID_BONES[c].parent === b) children.push(2 + c)
    }
    const nodeObj = {
      name: bone.name,
      translation: localT,
      rotation: [0, 0, 0, 1],
    }
    if (children.length > 0) nodeObj.children = children
    nodes.push(nodeObj)
  }

  // InverseBindMatrices for 24 bones (column-major 4x4 translation by -bindPositions[b])
  const ibmArray = new Float32Array(HUMANOID_BONES.length * 16)
  for (let b = 0; b < HUMANOID_BONES.length; b++) {
    const [px, py, pz] = bindPositions[b]
    const off = b * 16
    ibmArray[off + 0] = 1
    ibmArray[off + 5] = 1
    ibmArray[off + 10] = 1
    ibmArray[off + 12] = -px
    ibmArray[off + 13] = -py
    ibmArray[off + 14] = -pz
    ibmArray[off + 15] = 1
  }
  const ibmAcc = addAccessor(ibmArray, 5126, HUMANOID_BONES.length, 'MAT4')

  // Mesh primitives
  const gltfPrimitives = primitives.map(p => {
    const vCount = p.data.pos.length / 3
    const posAcc = addAccessor(p.data.pos, 5126, vCount, 'VEC3', 34962, true)
    const normAcc = addAccessor(p.data.norm, 5126, vCount, 'VEC3', 34962)
    const uvAcc = addAccessor(p.data.uv, 5126, vCount, 'VEC2', 34962)
    const jointsAcc = addAccessor(p.data.joints, 5121, vCount, 'VEC4', 34962)
    const weightsAcc = addAccessor(p.data.weights, 5126, vCount, 'VEC4', 34962)
    const idx16 = vCount < 65535 ? Uint16Array.from(p.data.indices) : p.data.indices
    const idxCompType = vCount < 65535 ? 5123 : 5125
    const idxAcc = addAccessor(idx16, idxCompType, idx16.length, 'SCALAR', 34963)
    return {
      attributes: {
        POSITION: posAcc,
        NORMAL: normAcc,
        TEXCOORD_0: uvAcc,
        JOINTS_0: jointsAcc,
        WEIGHTS_0: weightsAcc,
      },
      indices: idxAcc,
      material: p.matIndex,
    }
  })

  // Images & Textures
  const images = textures.map(t => {
    const bvIdx = appendBuffer(t.bytes)
    return { name: t.name, mimeType: t.mime, bufferView: bvIdx }
  })
  const gltfTextures = textures.map((_, idx) => ({ sampler: 0, source: idx }))

  // PBR Materials
  const materials = [
    // 0: Body_Skin
    {
      name: 'Body_Skin',
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicFactor: 0.01,
        roughnessFactor: 0.56,
      },
      normalTexture: { index: 1, scale: 0.26 },
    },
    // 1: Kit_Jersey
    {
      name: 'Kit_Jersey',
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 2 },
        metallicFactor: 0.02,
        roughnessFactor: 0.74,
      },
      normalTexture: { index: 3, scale: 0.65 },
    },
    // 2: Kit_Shorts
    {
      name: 'Kit_Shorts',
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 2 },
        metallicFactor: 0.02,
        roughnessFactor: 0.76,
      },
      normalTexture: { index: 3, scale: 0.60 },
    },
    // 3: Kit_Socks
    {
      name: 'Kit_Socks',
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 4 },
        metallicFactor: 0.01,
        roughnessFactor: 0.86,
      },
    },
    // 4: Footwear_Cleats
    {
      name: 'Footwear_Cleats',
      pbrMetallicRoughness: {
        baseColorTexture: { index: 5 },
        metallicFactor: 0.12,
        roughnessFactor: 0.42,
      },
      normalTexture: { index: 6, scale: 0.50 },
    },
    // 5: Head_Hair
    {
      name: 'Head_Hair',
      doubleSided: true,
      alphaMode: 'MASK',
      alphaCutoff: 0.25,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 7 },
        metallicFactor: 0.02,
        roughnessFactor: 0.78,
      },
    },
    // 6: Head_Eyes
    {
      name: 'Head_Eyes',
      pbrMetallicRoughness: {
        baseColorTexture: { index: 8 },
        metallicFactor: 0.02,
        roughnessFactor: 0.12,
      },
    },
    // 7: Head_Brows
    {
      name: 'Head_Brows',
      doubleSided: true,
      alphaMode: 'MASK',
      alphaCutoff: 0.16,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 9 },
        metallicFactor: 0.0,
        roughnessFactor: 0.75,
      },
    },
    // 8: Head_Lashes
    {
      name: 'Head_Lashes',
      doubleSided: true,
      alphaMode: 'MASK',
      alphaCutoff: 0.16,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 10 },
        metallicFactor: 0.0,
        roughnessFactor: 0.72,
      },
    },
  ]

  // Skeletal Animations
  const gltfAnimations = animations.map(clip => {
    const timeAcc = addAccessor(clip.times, 5126, clip.times.length, 'SCALAR', undefined, true)
    const samplers = []
    const channels = []
    for (let b = 0; b < HUMANOID_BONES.length; b++) {
      const tr = clip.tracks.get(b)
      const rotAcc = addAccessor(tr.rots, 5126, clip.times.length, 'VEC4')
      const rotSamplerIdx = samplers.length
      samplers.push({ input: timeAcc, interpolation: 'LINEAR', output: rotAcc })
      channels.push({ sampler: rotSamplerIdx, target: { node: 2 + b, path: 'rotation' } })

      if (b === 0 && tr.trans) {
        const transAcc = addAccessor(tr.trans, 5126, clip.times.length, 'VEC3')
        const transSamplerIdx = samplers.length
        samplers.push({ input: timeAcc, interpolation: 'LINEAR', output: transAcc })
        channels.push({ sampler: transSamplerIdx, target: { node: 2 + b, path: 'translation' } })
      }
    }
    return { name: clip.name, samplers, channels }
  })

  const gltfJson = {
    asset: {
      version: '2.0',
      generator: 'Ballors CC0 MakeHuman Rigged Asset Pipeline',
      copyright: 'CC0 1.0 Universal (Innerscene / MakeHuman Community)',
    },
    scene: 0,
    scenes: [{ name: 'Scene', nodes: [0] }],
    nodes,
    skins: [
      {
        name: 'FootballerArmature',
        inverseBindMatrices: ibmAcc,
        skeleton: 2,
        joints: HUMANOID_BONES.map((_, b) => 2 + b),
      },
    ],
    meshes: [{ name: 'FootballerMesh', primitives: gltfPrimitives }],
    materials,
    textures: gltfTextures,
    images,
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    animations: gltfAnimations,
    bufferViews,
    accessors,
    buffers: [{ byteLength: byteOffset }],
  }

  const jsonBuffer = Buffer.from(JSON.stringify(gltfJson), 'utf8')
  const jsonPad = (4 - (jsonBuffer.length % 4)) % 4
  const jsonPadded = jsonPad > 0 ? Buffer.concat([jsonBuffer, Buffer.alloc(jsonPad, 0x20)]) : jsonBuffer
  const binBuffer = Buffer.concat(chunks)

  const totalLength = 12 + 8 + jsonPadded.length + 8 + binBuffer.length
  const header = Buffer.alloc(12)
  header.write('glTF', 0, 4, 'ascii')
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(totalLength, 8)

  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(jsonPadded.length, 0)
  jsonHeader.write('JSON', 4, 4, 'ascii')

  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(binBuffer.length, 0)
  binHeader.write('BIN\0', 4, 4, 'ascii')

  fs.writeFileSync(outPath, Buffer.concat([header, jsonHeader, jsonPadded, binHeader, binBuffer]))
  console.log(`   Wrote ${path.basename(outPath)} (${(totalLength / 1024).toFixed(1)} KB)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
