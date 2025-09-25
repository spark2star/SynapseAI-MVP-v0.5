"""
ICD-11 API Integration Service
Provides comprehensive access to WHO International Classification of Diseases database
"""

import asyncio
import aiohttp
import json
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import logging
from functools import lru_cache
import os
from urllib.parse import quote

logger = logging.getLogger(__name__)

class ICD11Service:
    """Service for integrating with WHO ICD-11 API and local database"""
    
    def __init__(self):
        self.base_url = "https://id.who.int/icd"
        self.api_version = "release/11/2023-01"
        self.client_id = os.getenv("ICD11_CLIENT_ID")
        self.client_secret = os.getenv("ICD11_CLIENT_SECRET")
        self.access_token = None
        self.token_expires = None
        
        # Mental health chapter focus - ICD-11 Chapter 6
        self.mental_health_chapter = "06"  # Mental, behavioural or neurodevelopmental disorders
        
        # Cache for frequently accessed data
        self._cache = {}
        self._cache_expiry = {}
        self.cache_duration = timedelta(hours=24)
        
    async def get_access_token(self) -> str:
        """Get OAuth2 access token for ICD-11 API"""
        if self.access_token and self.token_expires and datetime.now() < self.token_expires:
            return self.access_token
            
        if not self.client_id or not self.client_secret:
            logger.warning("ICD-11 credentials not configured, using fallback mode")
            return None
            
        token_url = f"{self.base_url}/oauth2/token"
        
        async with aiohttp.ClientSession() as session:
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'icdapi_access'
            }
            
            async with session.post(token_url, data=data) as response:
                if response.status == 200:
                    token_data = await response.json()
                    self.access_token = token_data['access_token']
                    expires_in = token_data.get('expires_in', 3600)
                    self.token_expires = datetime.now() + timedelta(seconds=expires_in - 300)  # 5 min buffer
                    logger.info("ICD-11 access token obtained successfully")
                    return self.access_token
                else:
                    logger.error(f"Failed to get ICD-11 access token: {response.status}")
                    return None
    
    async def search_symptoms(self, query: str, limit: int = 10, focus_mental_health: bool = True) -> List[Dict[str, Any]]:
        """
        Search ICD-11 for symptoms and conditions
        
        Args:
            query: Search term
            limit: Maximum number of results
            focus_mental_health: Whether to focus on mental health disorders
            
        Returns:
            List of symptom/condition dictionaries
        """
        try:
            # Check cache first
            cache_key = f"search_{query}_{limit}_{focus_mental_health}"
            if cache_key in self._cache and datetime.now() < self._cache_expiry.get(cache_key, datetime.min):
                logger.info(f"Returning cached ICD-11 search results for: {query}")
                return self._cache[cache_key]
            
            access_token = await self.get_access_token()
            if not access_token:
                logger.warning("No ICD-11 access token, falling back to local database")
                return await self._fallback_search(query, limit)
            
            # Search using ICD-11 API
            search_url = f"{self.base_url}/{self.api_version}/mms/search"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json',
                'API-Version': 'v2',
                'Accept-Language': 'en'
            }
            
            params = {
                'q': query,
                'subtreeFilterUsesFoundationDescendants': 'false',
                'includeKeywordResult': 'true',
                'useFlexisearch': 'true',
                'flatResults': 'true',
                'highlightingEnabled': 'true'
            }
            
            # Focus on mental health chapter if requested
            if focus_mental_health:
                params['chapterFilter'] = self.mental_health_chapter
                
            async with aiohttp.ClientSession() as session:
                async with session.get(search_url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        results = await self._process_icd_results(data, limit)
                        
                        # Cache the results
                        self._cache[cache_key] = results
                        self._cache_expiry[cache_key] = datetime.now() + self.cache_duration
                        
                        logger.info(f"Found {len(results)} ICD-11 results for: {query}")
                        return results
                    else:
                        logger.error(f"ICD-11 API search failed: {response.status}")
                        return await self._fallback_search(query, limit)
                        
        except Exception as e:
            logger.error(f"ICD-11 search error: {str(e)}")
            return await self._fallback_search(query, limit)
    
    async def _process_icd_results(self, data: Dict, limit: int) -> List[Dict[str, Any]]:
        """Process ICD-11 API response into standardized format"""
        results = []
        
        # Extract search results from ICD-11 response
        destinations = data.get('destinationEntities', [])
        
        for item in destinations[:limit]:
            try:
                # Extract key information
                icd_code = item.get('theCode', '')
                title = item.get('title', {}).get('@value', 'Unknown')
                description = item.get('definition', {}).get('@value', '') if item.get('definition') else ''
                
                # Extract chapter and category info
                chapter = item.get('chapter', '')
                ancestors = item.get('ancestors', [])
                
                # Build categories list
                categories = [icd_code] if icd_code else []
                if chapter:
                    categories.append(f"ICD11-{chapter}")
                
                # Create standardized symptom object
                symptom = {
                    'id': f"icd11-{icd_code}" if icd_code else f"icd11-{hash(title) % 10000:04d}",
                    'name': title,
                    'description': description[:500] + '...' if len(description) > 500 else description,
                    'categories': categories,
                    'source': 'icd11',
                    'icd_code': icd_code,
                    'chapter': chapter,
                    'url': item.get('@id', ''),
                    'score': item.get('score', 0.0)
                }
                
                # Add aliases based on synonyms if available
                synonyms = item.get('synonym', [])
                if synonyms:
                    aliases = []
                    for synonym in synonyms:
                        if isinstance(synonym, dict) and '@value' in synonym:
                            aliases.append(synonym['@value'])
                        elif isinstance(synonym, str):
                            aliases.append(synonym)
                    symptom['aliases'] = aliases[:5]  # Limit aliases
                
                results.append(symptom)
                
            except Exception as e:
                logger.warning(f"Error processing ICD-11 result item: {str(e)}")
                continue
        
        # Sort by relevance score if available
        results.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        return results
    
    async def _fallback_search(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Fallback to enhanced local symptom database"""
        logger.info(f"Using enhanced local symptom database for: {query}")
        
        # Enhanced local symptom database with comprehensive mental health symptoms
        enhanced_symptoms = [
            # Anxiety Disorders
            {
                "id": "local-001", "name": "Anxiety", "description": "Excessive worry, nervousness, or unease about future events",
                "categories": ["ICD11-6B00", "ICD11-6B01"], "source": "local",
                "aliases": ["Anxiousness", "Worry", "Nervousness", "Apprehension"]
            },
            {
                "id": "local-002", "name": "Panic Attacks", "description": "Sudden episodes of intense fear with physical symptoms",
                "categories": ["ICD11-6B01"], "source": "local",
                "aliases": ["Panic episodes", "Anxiety attacks", "Panic disorder"]
            },
            {
                "id": "local-003", "name": "Social Anxiety", "description": "Fear of social situations and being judged by others",
                "categories": ["ICD11-6B04"], "source": "local",
                "aliases": ["Social phobia", "Social fear", "Performance anxiety"]
            },
            {
                "id": "local-004", "name": "Generalized Anxiety", "description": "Persistent excessive worry about various life areas",
                "categories": ["ICD11-6B00"], "source": "local",
                "aliases": ["GAD", "Chronic worry", "Persistent anxiety"]
            },
            
            # Mood Disorders
            {
                "id": "local-010", "name": "Depression", "description": "Persistent feelings of sadness, hopelessness, and loss of interest",
                "categories": ["ICD11-6A70", "ICD11-6A71"], "source": "local",
                "aliases": ["Depressed mood", "Major depression", "Clinical depression", "Sadness"]
            },
            {
                "id": "local-011", "name": "Bipolar Episodes", "description": "Alternating periods of mania and depression",
                "categories": ["ICD11-6A60"], "source": "local",
                "aliases": ["Manic episodes", "Bipolar disorder", "Mood swings"]
            },
            {
                "id": "local-012", "name": "Irritability", "description": "Increased sensitivity to frustration and anger",
                "categories": ["ICD11-6A70"], "source": "local",
                "aliases": ["Anger", "Frustration", "Short temper", "Agitation"]
            },
            
            # Sleep Disorders
            {
                "id": "local-020", "name": "Insomnia", "description": "Difficulty falling or staying asleep",
                "categories": ["ICD11-7A00"], "source": "local",
                "aliases": ["Sleep problems", "Can't sleep", "Sleeplessness", "Sleep disturbance"]
            },
            {
                "id": "local-021", "name": "Nightmares", "description": "Disturbing dreams causing distress and sleep disruption",
                "categories": ["ICD11-7A03"], "source": "local",
                "aliases": ["Bad dreams", "Night terrors", "Dream disturbance"]
            },
            
            # Cognitive Symptoms
            {
                "id": "local-030", "name": "Concentration Difficulty", "description": "Problems focusing attention and maintaining concentration",
                "categories": ["ICD11-6A02"], "source": "local",
                "aliases": ["Focus problems", "Attention issues", "Mental fog", "Distractibility"]
            },
            {
                "id": "local-031", "name": "Memory Problems", "description": "Difficulty with recall and memory formation",
                "categories": ["ICD11-6A02"], "source": "local",
                "aliases": ["Forgetfulness", "Memory loss", "Cognitive issues"]
            },
            
            # Behavioral Symptoms
            {
                "id": "local-040", "name": "Social Withdrawal", "description": "Avoiding social interactions and isolating from others",
                "categories": ["ICD11-6A70", "ICD11-6A02"], "source": "local",
                "aliases": ["Isolation", "Avoiding people", "Social isolation", "Withdrawal"]
            },
            {
                "id": "local-041", "name": "Agitation", "description": "Restlessness and inability to remain calm",
                "categories": ["ICD11-6A70"], "source": "local",
                "aliases": ["Restlessness", "Fidgeting", "Unable to sit still"]
            },
            
            # Physical Symptoms
            {
                "id": "local-050", "name": "Fatigue", "description": "Persistent tiredness not relieved by rest",
                "categories": ["ICD11-6A70", "ICD11-MB23"], "source": "local",
                "aliases": ["Tiredness", "Exhaustion", "Low energy", "Lethargy"]
            },
            {
                "id": "local-051", "name": "Appetite Changes", "description": "Significant increase or decrease in appetite",
                "categories": ["ICD11-6A70"], "source": "local",
                "aliases": ["Eating changes", "Loss of appetite", "Increased appetite"]
            },
            
            # Trauma and Stress
            {
                "id": "local-060", "name": "Flashbacks", "description": "Involuntary re-experiencing of traumatic events",
                "categories": ["ICD11-6B40"], "source": "local",
                "aliases": ["Trauma memories", "Intrusive memories", "PTSD flashbacks"]
            },
            {
                "id": "local-061", "name": "Hypervigilance", "description": "State of enhanced alertness and scanning for threats",
                "categories": ["ICD11-6B40"], "source": "local",
                "aliases": ["Heightened alertness", "Always on guard", "Paranoid feelings"]
            },
            
            # Substance-Related
            {
                "id": "local-070", "name": "Substance Cravings", "description": "Strong desire to use alcohol or drugs",
                "categories": ["ICD11-6C40", "ICD11-6C50"], "source": "local",
                "aliases": ["Addiction cravings", "Urges to use", "Substance urges"]
            }
        ]
        
        # Filter based on search query
        search_term = query.lower()
        filtered_symptoms = []
        
        for symptom in enhanced_symptoms:
            if (search_term in symptom["name"].lower() or 
                search_term in symptom["description"].lower() or
                any(search_term in alias.lower() for alias in symptom.get("aliases", []))):
                filtered_symptoms.append(symptom)
        
        return filtered_symptoms[:limit]
    
    async def get_symptom_details(self, icd_code: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific ICD-11 code"""
        try:
            access_token = await self.get_access_token()
            if not access_token:
                return None
                
            details_url = f"{self.base_url}/{self.api_version}/mms/entities/{icd_code}"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json',
                'API-Version': 'v2',
                'Accept-Language': 'en'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(details_url, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Failed to get ICD-11 details for {icd_code}: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error getting ICD-11 details: {str(e)}")
            return None

# Global ICD-11 service instance
icd11_service = ICD11Service()
