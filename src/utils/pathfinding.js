export class Graph {
  constructor() {
    this.nodes = new Map();
  }

  addNode(node) {
    if (!this.nodes.has(node)) {
      this.nodes.set(node, []);
    }
  }

  addEdge(node1, node2, weight) {
    // Asegurarse de que ambos nodos existan
    this.addNode(node1);
    this.addNode(node2);
    // Agregar conexión bidireccional
    this.nodes.get(node1).push({ node: node2, weight });
    this.nodes.get(node2).push({ node: node1, weight });
  }

  // Calcular distancia entre dos puntos geográficos
  static calculateDistance(point1, point2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  }
}

export const dijkstra = (graph, startNode, endNode) => {
  // Conjunto de nodos no visitados
  const unvisited = new Set(graph.nodes.keys());
  // Distancias desde el nodo inicial
  const distances = new Map();
  // Nodos previos para reconstruir el camino
  const previous = new Map();

  // Inicializar distancias
  for (let node of graph.nodes.keys()) {
    distances.set(node, Infinity);
  }
  distances.set(startNode, 0);

  while (unvisited.size > 0) {
    // Encontrar el nodo no visitado con la menor distancia
    let currentNode = null;
    let shortestDistance = Infinity;
    for (let node of unvisited) {
      if (distances.get(node) < shortestDistance) {
        currentNode = node;
        shortestDistance = distances.get(node);
      }
    }

    // Si no hay camino posible o hemos llegado al destino
    if (currentNode === null || currentNode === endNode) break;

    // Marcar como visitado
    unvisited.delete(currentNode);

    // Actualizar distancias de los vecinos
    for (let { node: neighbor, weight } of graph.nodes.get(currentNode)) {
      if (unvisited.has(neighbor)) {
        const distance = distances.get(currentNode) + weight;
        if (distance < distances.get(neighbor)) {
          distances.set(neighbor, distance);
          previous.set(neighbor, currentNode);
        }
      }
    }
  }

  // Reconstruir el camino
  const path = [];
  let currentNode = endNode;
  while (currentNode !== null && currentNode !== undefined) {
    path.unshift(currentNode);
    currentNode = previous.get(currentNode);
  }

  return {
    path,
    distance: distances.get(endNode)
  };
};

export const findShortestPath = (locations, start, end) => {
  // Crear grafo a partir de las ubicaciones
  const graph = new Graph();
  
  // Agregar todos los nodos
  locations.forEach(location => {
    graph.addNode({
      latitude: location.latitude,
      longitude: location.longitude,
      id: location.id,
      name: location.name
    });
  });

  // Conectar nodos cercanos (crear aristas)
  const MAX_DISTANCE = 5; // Distancia máxima en km para conectar puntos
  locations.forEach(loc1 => {
    locations.forEach(loc2 => {
      if (loc1.id !== loc2.id) {
        const point1 = { latitude: loc1.latitude, longitude: loc1.longitude };
        const point2 = { latitude: loc2.latitude, longitude: loc2.longitude };
        const distance = Graph.calculateDistance(point1, point2);
        
        if (distance <= MAX_DISTANCE) {
          graph.addEdge(
            { ...point1, id: loc1.id, name: loc1.name },
            { ...point2, id: loc2.id, name: loc2.name },
            distance
          );
        }
      }
    });
  });

  // Encontrar el camino más corto
  const result = dijkstra(graph, start, end);
  
  return {
    path: result.path,
    distance: result.distance,
    graph // Devolver el grafo para visualización si es necesario
  };
};

// Función auxiliar para crear waypoints intermedios
export const createIntermediatePoints = (point1, point2, numPoints = 10) => {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    points.push({
      latitude: point1.latitude + (point2.latitude - point1.latitude) * fraction,
      longitude: point1.longitude + (point2.longitude - point1.longitude) * fraction
    });
  }
  return points;
}; 