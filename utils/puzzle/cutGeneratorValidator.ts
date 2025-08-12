import { Point } from "@/types/puzzleTypes";
import { CutLine, Bounds } from "./cutGeneratorTypes";
import { CUT_GENERATOR_CONFIG } from "./cutGeneratorConfig";
import { 
  doesCutIntersectShape, 
  cutsAreTooClose, 
  calculateCenter, 
  isPointNearLine 
} from "./cutGeneratorGeometry";

/**
 * 切割线验证器
 * 负责验证生成的切割线是否有效
 */

export class CutValidator {
  
  isValid(cut: CutLine, shape: Point[], existingCuts: CutLine[], relaxed: boolean = false): boolean {
    // 基础验证：检查是否与形状相交
    if (doesCutIntersectShape(cut, shape) < 2) {
      return false;
    }

    // 检查是否与现有切割线太接近
    for (const existingCut of existingCuts) {
      if (cutsAreTooClose(cut, existingCut)) {
        return false;
      }
    }

    // 对于宽松模式，跳过中心检查
    if (relaxed) {
      return true;
    }

    // 检查是否穿过中心区域
    const bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 }; // 临时边界
    const center = calculateCenter(bounds);
    return isPointNearLine(center, cut, CUT_GENERATOR_CONFIG.CENTER_DISTANCE_THRESHOLD);
  }

}