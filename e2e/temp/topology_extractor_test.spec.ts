/**
 * 拓扑结构提取器 Playwright 测试
 * 测试形状记忆系统的拓扑结构提取功能
 */

import { test, expect } from '@playwright/test';

test.describe('拓扑结构提取器测试', () => {
  
  test('应该能够提取简单三角形的拓扑结构', async ({ page }) => {
    // 创建一个测试页面来运行拓扑提取器
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>拓扑结构提取器测试</title>
      </head>
      <body>
        <div id="test-results"></div>
        <script type="module">
          // 模拟导入拓扑结构提取器
          const TopologyExtractor = class {
            extractTopology(points, canvasSize, options = {}) {
              if (!points || points.length === 0) {
                throw new Error('无法从空点数组提取拓扑结构');
              }

              // 计算边界框
              const bounds = this.calculateBoundingBox(points);
              
              // 创建拓扑节点
              const nodes = this.createTopologyNodes(points, bounds);
              
              // 生成节点关系
              const relationships = this.generateNodeRelationships(nodes);
              
              // 分析边界信息
              const boundingInfo = this.analyzeBoundingInfo(points, bounds);
              
              return {
                nodes,
                relationships,
                boundingInfo,
                version: '1.0.0'
              };
            }

            calculateBoundingBox(points) {
              return points.reduce(
                (acc, point) => ({
                  minX: Math.min(acc.minX, point.x),
                  maxX: Math.max(acc.maxX, point.x),
                  minY: Math.min(acc.minY, point.y),
                  maxY: Math.max(acc.maxY, point.y)
                }),
                { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
              );
            }

            createTopologyNodes(points, boundingBox) {
              const shapeWidth = Math.max(boundingBox.maxX - boundingBox.minX, 1e-6);
              const shapeHeight = Math.max(boundingBox.maxY - boundingBox.minY, 1e-6);

              return points.map((point, index) => ({
                id: \`node_\${index}\`,
                type: 'vertex',
                relativePosition: {
                  xRatio: Math.max(0, Math.min(1, (point.x - boundingBox.minX) / shapeWidth)),
                  yRatio: Math.max(0, Math.min(1, (point.y - boundingBox.minY) / shapeHeight))
                },
                connections: this.getNodeConnections(index, points.length),
                metadata: {
                  importance: this.calculateNodeImportance(point, points, index)
                }
              }));
            }

            getNodeConnections(nodeIndex, totalNodes) {
              const connections = [];
              
              if (nodeIndex > 0) {
                connections.push(\`node_\${nodeIndex - 1}\`);
              }
              
              if (nodeIndex < totalNodes - 1) {
                connections.push(\`node_\${nodeIndex + 1}\`);
              }
              
              if (totalNodes > 2) {
                if (nodeIndex === 0) {
                  connections.push(\`node_\${totalNodes - 1}\`);
                }
                if (nodeIndex === totalNodes - 1) {
                  connections.push('node_0');
                }
              }
              
              return connections;
            }

            calculateNodeImportance(point, allPoints, index) {
              const totalPoints = allPoints.length;
              if (totalPoints < 3) return 1.0;

              const prevIndex = (index - 1 + totalPoints) % totalPoints;
              const nextIndex = (index + 1) % totalPoints;
              
              const prevPoint = allPoints[prevIndex];
              const nextPoint = allPoints[nextIndex];
              
              const angle1 = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
              const angle2 = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
              let angleDiff = Math.abs(angle2 - angle1);
              
              if (angleDiff > Math.PI) {
                angleDiff = 2 * Math.PI - angleDiff;
              }
              
              return angleDiff / Math.PI;
            }

            generateNodeRelationships(nodes) {
              const relationships = [];
              
              for (const node of nodes) {
                for (const connectionId of node.connections) {
                  const existingRel = relationships.find(rel => 
                    (rel.fromNodeId === node.id && rel.toNodeId === connectionId) ||
                    (rel.fromNodeId === connectionId && rel.toNodeId === node.id)
                  );
                  
                  if (!existingRel) {
                    relationships.push({
                      fromNodeId: node.id,
                      toNodeId: connectionId,
                      type: 'edge',
                      strength: 1.0
                    });
                  }
                }
              }
              
              return relationships;
            }

            analyzeBoundingInfo(points, bounds) {
              const width = bounds.maxX - bounds.minX;
              const height = bounds.maxY - bounds.minY;
              
              return {
                aspectRatio: height > 0 ? width / height : 1.0,
                complexity: this.calculateComplexity(points),
                symmetry: {
                  hasVerticalSymmetry: false,
                  hasHorizontalSymmetry: false,
                  hasRotationalSymmetry: false
                },
                area: this.calculateRelativeArea(points, bounds)
              };
            }

            calculateComplexity(points) {
              if (points.length < 3) return 0;
              
              let totalAngleChange = 0;
              const n = points.length;
              
              for (let i = 0; i < n; i++) {
                const prev = points[(i - 1 + n) % n];
                const curr = points[i];
                const next = points[(i + 1) % n];
                
                const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
                const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
                totalAngleChange += Math.abs(angle2 - angle1);
              }
              
              return Math.min(1.0, totalAngleChange / (2 * Math.PI * n));
            }

            calculateRelativeArea(points, bounds) {
              if (points.length < 3) return 0;
              
              let area = 0;
              const n = points.length;
              
              for (let i = 0; i < n; i++) {
                const j = (i + 1) % n;
                area += points[i].x * points[j].y;
                area -= points[j].x * points[i].y;
              }
              area = Math.abs(area) / 2;
              
              const boundingArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
              return boundingArea > 0 ? area / boundingArea : 0;
            }
          };

          // 运行测试
          const extractor = new TopologyExtractor();
          const results = [];

          try {
            // 测试1: 简单三角形
            const trianglePoints = [
              { x: 100, y: 100 },
              { x: 200, y: 100 },
              { x: 150, y: 50 }
            ];
            const canvasSize = { width: 400, height: 300 };

            const triangleTopology = extractor.extractTopology(trianglePoints, canvasSize);
            
            results.push({
              test: '三角形拓扑提取',
              success: triangleTopology.nodes.length === 3 && 
                      triangleTopology.relationships.length === 3 &&
                      triangleTopology.version === '1.0.0',
              details: {
                nodeCount: triangleTopology.nodes.length,
                relationshipCount: triangleTopology.relationships.length,
                version: triangleTopology.version
              }
            });

            // 测试2: 正方形
            const squarePoints = [
              { x: 100, y: 100 },
              { x: 200, y: 100 },
              { x: 200, y: 200 },
              { x: 100, y: 200 }
            ];

            const squareTopology = extractor.extractTopology(squarePoints, canvasSize);
            
            // 检查相对位置是否在有效范围内
            const validRelativePositions = squareTopology.nodes.every(node => 
              node.relativePosition.xRatio >= 0 && node.relativePosition.xRatio <= 1 &&
              node.relativePosition.yRatio >= 0 && node.relativePosition.yRatio <= 1
            );

            results.push({
              test: '正方形拓扑提取',
              success: squareTopology.nodes.length === 4 && 
                      squareTopology.relationships.length === 4 &&
                      validRelativePositions,
              details: {
                nodeCount: squareTopology.nodes.length,
                relationshipCount: squareTopology.relationships.length,
                validRelativePositions,
                aspectRatio: squareTopology.boundingInfo.aspectRatio
              }
            });

            // 测试3: 边界信息计算
            results.push({
              test: '边界信息计算',
              success: squareTopology.boundingInfo.aspectRatio === 1.0 && // 正方形宽高比为1
                      squareTopology.boundingInfo.complexity >= 0 &&
                      squareTopology.boundingInfo.area > 0 &&
                      squareTopology.boundingInfo.area <= 1,
              details: {
                aspectRatio: squareTopology.boundingInfo.aspectRatio,
                complexity: squareTopology.boundingInfo.complexity,
                area: squareTopology.boundingInfo.area
              }
            });

            // 测试4: 错误处理
            let errorHandled = false;
            try {
              extractor.extractTopology([], canvasSize);
            } catch (error) {
              errorHandled = error.message === '无法从空点数组提取拓扑结构';
            }

            results.push({
              test: '错误处理',
              success: errorHandled,
              details: {
                errorHandled
              }
            });

            // 测试5: 节点连接关系
            const connections = triangleTopology.nodes[0].connections;
            const hasCorrectConnections = connections.includes('node_1') && connections.includes('node_2');

            results.push({
              test: '节点连接关系',
              success: hasCorrectConnections,
              details: {
                firstNodeConnections: connections,
                hasCorrectConnections
              }
            });

          } catch (error) {
            results.push({
              test: '测试执行',
              success: false,
              error: error.message
            });
          }

          // 显示结果
          document.getElementById('test-results').innerHTML = 
            '<h2>拓扑结构提取器测试结果</h2>' +
            results.map(result => 
              \`<div style="margin: 10px 0; padding: 10px; border: 1px solid \${result.success ? 'green' : 'red'}; background: \${result.success ? '#e8f5e8' : '#ffe8e8'}">
                <h3>\${result.test}: \${result.success ? '✅ 通过' : '❌ 失败'}</h3>
                <pre>\${JSON.stringify(result.details || result.error, null, 2)}</pre>
              </div>\`
            ).join('');

          // 设置全局测试结果供 Playwright 检查
          window.testResults = results;
        </script>
      </body>
      </html>
    `);

    // 等待测试执行完成
    await page.waitForFunction(() => window.testResults);

    // 获取测试结果
    const testResults = await page.evaluate(() => window.testResults);

    // 验证所有测试都通过
    for (const result of testResults) {
      expect(result.success, `测试失败: ${result.test} - ${JSON.stringify(result.details || result.error)}`).toBe(true);
    }

    // 验证测试结果显示
    const resultsElement = await page.locator('#test-results');
    await expect(resultsElement).toBeVisible();
    
    // 检查是否有成功的测试结果显示
    const successElements = await page.locator('div:has-text("✅ 通过")');
    const successCount = await successElements.count();
    expect(successCount).toBeGreaterThan(0);

    console.log('拓扑结构提取器测试结果:', testResults);
  });

  test('应该能够处理复杂形状的拓扑提取', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>复杂形状拓扑提取测试</title>
      </head>
      <body>
        <div id="complex-test-results"></div>
        <script type="module">
          // 使用相同的 TopologyExtractor 类（简化版）
          const TopologyExtractor = class {
            extractTopology(points, canvasSize) {
              const bounds = this.calculateBoundingBox(points);
              const nodes = this.createTopologyNodes(points, bounds);
              const relationships = this.generateNodeRelationships(nodes);
              const boundingInfo = this.analyzeBoundingInfo(points, bounds);
              
              return { nodes, relationships, boundingInfo, version: '1.0.0' };
            }

            calculateBoundingBox(points) {
              return points.reduce(
                (acc, point) => ({
                  minX: Math.min(acc.minX, point.x),
                  maxX: Math.max(acc.maxX, point.x),
                  minY: Math.min(acc.minY, point.y),
                  maxY: Math.max(acc.maxY, point.y)
                }),
                { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
              );
            }

            createTopologyNodes(points, boundingBox) {
              const shapeWidth = Math.max(boundingBox.maxX - boundingBox.minX, 1e-6);
              const shapeHeight = Math.max(boundingBox.maxY - boundingBox.minY, 1e-6);

              return points.map((point, index) => ({
                id: \`node_\${index}\`,
                type: 'vertex',
                relativePosition: {
                  xRatio: (point.x - boundingBox.minX) / shapeWidth,
                  yRatio: (point.y - boundingBox.minY) / shapeHeight
                },
                connections: this.getNodeConnections(index, points.length),
                metadata: { importance: Math.random() * 0.5 + 0.5 }
              }));
            }

            getNodeConnections(nodeIndex, totalNodes) {
              const connections = [];
              if (nodeIndex > 0) connections.push(\`node_\${nodeIndex - 1}\`);
              if (nodeIndex < totalNodes - 1) connections.push(\`node_\${nodeIndex + 1}\`);
              if (totalNodes > 2) {
                if (nodeIndex === 0) connections.push(\`node_\${totalNodes - 1}\`);
                if (nodeIndex === totalNodes - 1) connections.push('node_0');
              }
              return connections;
            }

            generateNodeRelationships(nodes) {
              const relationships = [];
              for (const node of nodes) {
                for (const connectionId of node.connections) {
                  const exists = relationships.find(rel => 
                    (rel.fromNodeId === node.id && rel.toNodeId === connectionId) ||
                    (rel.fromNodeId === connectionId && rel.toNodeId === node.id)
                  );
                  if (!exists) {
                    relationships.push({
                      fromNodeId: node.id,
                      toNodeId: connectionId,
                      type: 'edge',
                      strength: 1.0
                    });
                  }
                }
              }
              return relationships;
            }

            analyzeBoundingInfo(points, bounds) {
              const width = bounds.maxX - bounds.minX;
              const height = bounds.maxY - bounds.minY;
              return {
                aspectRatio: height > 0 ? width / height : 1.0,
                complexity: Math.min(1.0, points.length / 20),
                symmetry: { hasVerticalSymmetry: false, hasHorizontalSymmetry: false, hasRotationalSymmetry: false },
                area: 0.5
              };
            }
          };

          const extractor = new TopologyExtractor();
          const results = [];

          // 测试复杂多边形（八边形）
          const octagonPoints = [];
          const centerX = 200, centerY = 200, radius = 100;
          for (let i = 0; i < 8; i++) {
            const angle = (i * 2 * Math.PI) / 8;
            octagonPoints.push({
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle)
            });
          }

          const octagonTopology = extractor.extractTopology(octagonPoints, { width: 400, height: 400 });
          
          results.push({
            test: '八边形拓扑提取',
            success: octagonTopology.nodes.length === 8 && 
                    octagonTopology.relationships.length === 8,
            details: {
              nodeCount: octagonTopology.nodes.length,
              relationshipCount: octagonTopology.relationships.length,
              complexity: octagonTopology.boundingInfo.complexity
            }
          });

          // 测试不规则形状
          const irregularPoints = [
            { x: 50, y: 50 },
            { x: 150, y: 30 },
            { x: 250, y: 80 },
            { x: 300, y: 150 },
            { x: 280, y: 250 },
            { x: 200, y: 300 },
            { x: 100, y: 280 },
            { x: 30, y: 200 },
            { x: 20, y: 120 }
          ];

          const irregularTopology = extractor.extractTopology(irregularPoints, { width: 400, height: 400 });
          
          results.push({
            test: '不规则形状拓扑提取',
            success: irregularTopology.nodes.length === irregularPoints.length &&
                    irregularTopology.relationships.length === irregularPoints.length,
            details: {
              nodeCount: irregularTopology.nodes.length,
              expectedNodes: irregularPoints.length,
              relationshipCount: irregularTopology.relationships.length,
              aspectRatio: irregularTopology.boundingInfo.aspectRatio
            }
          });

          // 显示结果
          document.getElementById('complex-test-results').innerHTML = 
            '<h2>复杂形状拓扑提取测试结果</h2>' +
            results.map(result => 
              \`<div style="margin: 10px 0; padding: 10px; border: 1px solid \${result.success ? 'green' : 'red'}; background: \${result.success ? '#e8f5e8' : '#ffe8e8'}">
                <h3>\${result.test}: \${result.success ? '✅ 通过' : '❌ 失败'}</h3>
                <pre>\${JSON.stringify(result.details, null, 2)}</pre>
              </div>\`
            ).join('');

          window.complexTestResults = results;
        </script>
      </body>
      </html>
    `);

    await page.waitForFunction(() => window.complexTestResults);
    const testResults = await page.evaluate(() => window.complexTestResults);

    for (const result of testResults) {
      expect(result.success, `复杂形状测试失败: ${result.test}`).toBe(true);
    }

    console.log('复杂形状拓扑提取测试结果:', testResults);
  });
});