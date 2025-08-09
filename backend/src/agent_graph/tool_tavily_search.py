from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool


class FacultyEngRuhunaSearchTool:
    """
    A specialized search tool for Faculty of Engineering, University of Ruhuna.
    Enhances user queries with faculty context and prioritizes official domains.
    """
    
    def __init__(self, search_tool):
        self.search_tool = search_tool
        self.official_domains = [
            "eng.ruh.ac.lk", 
            "ruh.ac.lk", 
            # "ugc.ac.lk", 
            # "moe.gov.lk",
            "lib.ruh.ac.lk"
        ]
        self.faculty_context = "Faculty of Engineering University of Ruhuna Sri Lanka"
    
    def search(self, user_query: str):
        """
        Enhanced search with faculty context and domain prioritization.
        
        Args:
            user_query (str): The user's search query
            
        Returns:
            list: Search results prioritizing official faculty domains
        """
        # Add faculty context to the query
        contextual_query = f"{user_query} {self.faculty_context}"
        
        # Add domain restrictions to prioritize official sources
        domain_filter = " OR ".join([f"site:{domain}" for domain in self.official_domains])
        enhanced_query = f"({contextual_query}) AND ({domain_filter})"
        
        try:
            results = self.search_tool.invoke(enhanced_query)
            
            # Filter and prioritize results from official domains
            official_results = []
            other_results = []
            
            for result in results:
                url = result.get('url', '').lower()
                if any(domain in url for domain in self.official_domains):
                    official_results.append(result)
                else:
                    other_results.append(result)
            
            # Return official results first, then others
            return official_results + other_results
            
        except Exception as e:
            print(f"Error during faculty search: {e}")
            return []


@tool
def faculty_search_tool(query: str) -> str:
    """
    Search for information related to Faculty of Engineering, University of Ruhuna.
    This tool prioritizes official university domains and adds relevant context to queries.
    
    Args:
        query (str): The search query related to the faculty
        
    Returns:
        str: Formatted search results from official sources
    """
    # Create base search tool
    base_search = TavilySearchResults(max_results=5)
    
    # Create faculty-specific search tool
    faculty_search = FacultyEngRuhunaSearchTool(base_search)
    
    # Perform the search
    results = faculty_search.search(query)
    
    if not results:
        return "No relevant information found for your query related to Faculty of Engineering, University of Ruhuna."
    
    # Format results
    formatted_results = []
    for i, result in enumerate(results[:3], 1):  # Limit to top 3 results
        title = result.get('title', 'No title')
        url = result.get('url', 'No URL')
        content = result.get('content', 'No content')[:300] + "..."
        
        formatted_results.append(
            f"{i}. **{title}**\n"
            f"   URL: {url}\n"
            f"   Content: {content}\n"
        )
    
    return "\n".join(formatted_results)


def load_tavily_search_tool(tavily_search_max_results: int):
    """
    This function initializes a Faculty of Engineering specialized Tavily search tool.
    The tool automatically adds faculty context and prioritizes official university domains.

    Args:
        tavily_search_max_results (int): The maximum number of search results to return for each query.

    Returns:
        function: The faculty_search_tool function configured for Faculty of Engineering searches.
    """
    return faculty_search_tool
