/**
 * Quality Trend Analyzer
 * 
 * Analyzes quality trends over time and provides predictive insights.
 */

import { ILogger } from '../interfaces';

export interface QualityTrendPoint {
  timestamp: Date;
  score: number;
  version?: string;
}

export interface TrendAnalysisResult {
  trend: 'improving' | 'declining' | 'stable';
  velocity: number;
  volatility: number;
  predictions: QualityPrediction[];
}

export interface QualityPrediction {
  timestamp: Date;
  predictedScore: number;
  confidence: number;
}

export class QualityTrendAnalyzer {
  private logger: ILogger;
  private historicalData: QualityTrendPoint[] = [];

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  addDataPoint(score: number, timestamp?: Date): void {
    const dataPoint: QualityTrendPoint = {
      timestamp: timestamp || new Date(),
      score
    };

    this.historicalData.push(dataPoint);
    this.historicalData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Keep only last 100 data points
    if (this.historicalData.length > 100) {
      this.historicalData = this.historicalData.slice(-100);
    }
  }

  analyzeTrends(): TrendAnalysisResult {
    if (this.historicalData.length < 3) {
      return {
        trend: 'stable',
        velocity: 0,
        volatility: 0,
        predictions: []
      };
    }

    const velocity = this.calculateVelocity();
    const volatility = this.calculateVolatility();
    const trend = this.determineTrend(velocity);
    const predictions = this.generatePredictions(velocity, volatility);

    return {
      trend,
      velocity,
      volatility,
      predictions
    };
  }

  private calculateVelocity(): number {
    const scores = this.historicalData.map(point => point.score);
    const n = scores.length;
    
    // Linear regression slope
    const sumX = (n * (n - 1)) / 2;
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + score * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.round(slope * 1000) / 1000;
  }

  private calculateVolatility(): number {
    const scores = this.historicalData.map(point => point.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.round(Math.sqrt(variance) * 100) / 100;
  }

  private determineTrend(velocity: number): 'improving' | 'declining' | 'stable' {
    if (velocity > 0.5) return 'improving';
    if (velocity < -0.5) return 'declining';
    return 'stable';
  }

  private generatePredictions(velocity: number, volatility: number): QualityPrediction[] {
    const predictions: QualityPrediction[] = [];
    const currentScore = this.historicalData[this.historicalData.length - 1].score;
    
    for (let i = 1; i <= 5; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i * 7); // Weekly predictions
      
      const predictedScore = Math.max(0, Math.min(100, currentScore + velocity * i));
      const confidence = Math.max(0, 100 - volatility * 10);
      
      predictions.push({
        timestamp: futureDate,
        predictedScore: Math.round(predictedScore * 100) / 100,
        confidence: Math.round(confidence * 100) / 100
      });
    }
    
    return predictions;
  }
}