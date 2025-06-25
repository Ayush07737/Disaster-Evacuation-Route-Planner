from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

class Graph:
    def __init__(self, vertices):
        self.V = vertices
        self.graph = [[0 for column in range(vertices)] for row in range(vertices)]

    def min_distance(self, dist, sptSet):
        min_dist = float('inf')
        min_index = -1
        
        for v in range(self.V):
            if dist[v] < min_dist and not sptSet[v]:
                min_dist = dist[v]
                min_index = v
                
        return min_index

    def dijkstra(self, src):
        dist = [float('inf')] * self.V
        dist[src] = 0
        sptSet = [False] * self.V
        parent = [-1] * self.V

        for _ in range(self.V):
            u = self.min_distance(dist, sptSet)
            sptSet[u] = True

            for v in range(self.V):
                if (self.graph[u][v] > 0 and not sptSet[v] and 
                    dist[v] > dist[u] + self.graph[u][v]):
                    dist[v] = dist[u] + self.graph[u][v]
                    parent[v] = u

        return dist, parent

    def get_path(self, parent, dest):
        path = []
        current = dest
        while current != -1:
            path.append(current)
            current = parent[current]
        return path[::-1]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate-route', methods=['POST'])
def calculate_route():
    data = request.json
    graph_matrix = data['graph']
    source = data['source']
    destination = data['destination']
    location_names = data.get('location_names', [])  # Add location names parameter
    
    # Create graph instance
    g = Graph(len(graph_matrix))
    g.graph = graph_matrix
    
    # Calculate shortest path
    distances, parents = g.dijkstra(source)
    path = g.get_path(parents, destination)
    
    # Create detailed path information
    detailed_path = []
    total_distance = 0
    
    for i in range(len(path) - 1):
        current_node = path[i]
        next_node = path[i + 1]
        distance = graph_matrix[current_node][next_node]
        total_distance += distance
        
        detailed_path.append({
            'from': location_names[current_node] if location_names else f"Node {current_node}",
            'to': location_names[next_node] if location_names else f"Node {next_node}",
            'distance': distance
        })
    
    return jsonify({
        'distance': distances[destination],
        'path': path,
        'detailed_path': detailed_path,
        'total_distance': total_distance
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000) 