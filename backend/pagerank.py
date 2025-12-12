"""
PageRank algorithm implementation for search result ranking.
Calculates authority scores based on link graph structure.
"""

import json
import os
from typing import Dict, List

LINK_GRAPH_FILE = "../data/link_graph.json"
PAGERANK_FILE = "../data/pagerank_scores.json"


def load_link_graph() -> Dict[str, List[str]]:
    """Load link graph from file."""
    if os.path.exists(LINK_GRAPH_FILE):
        with open(LINK_GRAPH_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_link_graph(link_graph: Dict[str, List[str]]):
    """Save link graph to file."""
    os.makedirs(os.path.dirname(LINK_GRAPH_FILE), exist_ok=True)
    with open(LINK_GRAPH_FILE, 'w') as f:
        json.dump(link_graph, f)


def calculate_pagerank(link_graph: Dict[str, List[str]], 
                       damping: float = 0.85, 
                       iterations: int = 20,
                       min_score: float = 0.15) -> Dict[str, float]:
    if not link_graph:
        return {}
    
    # Get all unique URLs
    all_urls = set(link_graph.keys())
    for targets in link_graph.values():
        all_urls.update(targets)
    
    all_urls = list(all_urls)
    num_pages = len(all_urls)
    
    if num_pages == 0:
        return {}
    
    # Initialize PageRank scores (uniform distribution)
    pagerank = {url: 1.0 / num_pages for url in all_urls}
    
    # Build reverse graph: {target: [sources that link to target]}
    incoming_links = {url: [] for url in all_urls}
    for source, targets in link_graph.items():
        for target in targets:
            if target in incoming_links:
                incoming_links[target].append(source)
    
    # Iterative PageRank calculation
    for iteration in range(iterations):
        new_pagerank = {}
        
        for url in all_urls:
            # Start with minimum score (teleportation)
            rank = min_score / num_pages
            
            # Add contribution from incoming links
            for source in incoming_links[url]:
                # Contribution = source_rank / num_outgoing_links_from_source
                outgoing_count = len(link_graph.get(source, []))
                if outgoing_count > 0:
                    rank += damping * (pagerank[source] / outgoing_count)
            
            new_pagerank[url] = rank
        
        pagerank = new_pagerank
    
    # Normalize scores to [0, 1]
    if pagerank:
        max_score = max(pagerank.values())
        min_pr = min(pagerank.values())
        score_range = max_score - min_pr
        
        if score_range > 0:
            pagerank = {
                url: (score - min_pr) / score_range 
                for url, score in pagerank.items()
            }
    
    return pagerank


def save_pagerank(pagerank_scores: Dict[str, float]):
    """Save PageRank scores to file."""
    os.makedirs(os.path.dirname(PAGERANK_FILE), exist_ok=True)
    with open(PAGERANK_FILE, 'w') as f:
        json.dump(pagerank_scores, f)


def load_pagerank() -> Dict[str, float]:
    """Load PageRank scores from file."""
    if os.path.exists(PAGERANK_FILE):
        with open(PAGERANK_FILE, 'r') as f:
            return json.load(f)
    return {}


def update_pagerank_from_crawler(crawler_link_graph: Dict[str, List[str]]):
    """
    Update PageRank scores from crawler's link graph.
    Merges with existing graph and recalculates.
    """
    # Load existing graph
    existing_graph = load_link_graph()
    
    # Merge with new links
    for source, targets in crawler_link_graph.items():
        if source in existing_graph:
            # Merge unique targets
            existing_graph[source] = list(set(existing_graph[source] + targets))
        else:
            existing_graph[source] = targets
    
    # Save updated graph
    save_link_graph(existing_graph)
    
    # Recalculate PageRank
    print(f"📊 Calculating PageRank for {len(existing_graph)} pages...")
    pagerank_scores = calculate_pagerank(existing_graph)
    
    # Save scores
    save_pagerank(pagerank_scores)
    
    print(f"✅ PageRank calculated! Top 5 pages:")
    top_pages = sorted(pagerank_scores.items(), key=lambda x: x[1], reverse=True)[:5]
    for url, score in top_pages:
        print(f"   {score:.4f} - {url[:80]}")
    
    return pagerank_scores


if __name__ == "__main__":
    # Test PageRank calculation
    test_graph = {
        "A": ["B", "C"],
        "B": ["C"],
        "C": ["A"],
        "D": ["C"]
    }
    
    scores = calculate_pagerank(test_graph)
    print("Test PageRank scores:")
    for url, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        print(f"{url}: {score:.4f}")
