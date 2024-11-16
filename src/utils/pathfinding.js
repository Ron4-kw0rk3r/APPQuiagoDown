export class Graph {
  constructor() {
    this.nodes = new Map();
  }

  addNode(node) {
    this.nodes.set(node, []);
  }

  addEdge(node1, node2, weight) {
    this.nodes.get(node1).push({ node: node2, weight });
    this.nodes.get(node2).push({ node: node1, weight });
  }
}

export const dijkstra = (graph, startNode, endNode) => {
  const distances = new Map();
  const previous = new Map();
  const unvisited = new Set();

  // Inicializar distancias
  for (let node of graph.nodes.keys()) {
    distances.set(node, Infinity);
    previous.set(node, null);
    unvisited.add(node);
  }
  distances.set(startNode, 0);

  while (unvisited.size > 0) {
    let currentNode = null;
    let shortestDistance = Infinity;

    // Encontrar el nodo no visitado con la distancia más corta
    for (let node of unvisited) {
      if (distances.get(node) < shortestDistance) {
        currentNode = node;
        shortestDistance = distances.get(node);
      }
    }

    if (currentNode === endNode) break;
    
    unvisited.delete(currentNode);

    // Actualizar distancias de nodos vecinos
    for (let neighbor of graph.nodes.get(currentNode)) {
      if (unvisited.has(neighbor.node)) {
        let distance = distances.get(currentNode) + neighbor.weight;
        if (distance < distances.get(neighbor.node)) {
          distances.set(neighbor.node, distance);
          previous.set(neighbor.node, currentNode);
        }
      }
    }
  }

  // Construir el camino
  const path = [];
  let current = endNode;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current);
  }

  return path;
}; 