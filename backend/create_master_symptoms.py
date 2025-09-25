"""
Script to populate master symptoms based on ICD-11 mental health categories.
This creates the baseline symptoms that doctors can use in patient intake.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.symptom import MasterSymptom


def create_master_symptoms():
    """Create initial master symptoms for mental health conditions."""
    
    master_symptoms_data = [
        # Anxiety-related symptoms
        {
            "name": "Anxiety",
            "description": "Feelings of worry, nervousness, or unease about something with an uncertain outcome",
            "categories": ["ICD11-6B00", "ICD11-6B01"],  # Anxiety disorders
            "aliases": ["Anxiousness", "Worry", "Nervousness"],
            "tags": ["anxiety", "worry", "nervous", "fear"]
        },
        {
            "name": "Panic Attacks",
            "description": "Sudden episodes of intense fear or anxiety with physical symptoms",
            "categories": ["ICD11-6B01"],  # Panic disorder
            "aliases": ["Panic episodes", "Anxiety attacks"],
            "tags": ["panic", "attack", "sudden", "intense", "fear"]
        },
        {
            "name": "Restlessness",
            "description": "Inability to rest or relax, feeling agitated or fidgety",
            "categories": ["ICD11-6B00"],  # Anxiety disorders
            "aliases": ["Agitation", "Fidgeting", "Unable to relax"],
            "tags": ["restless", "agitated", "fidgety", "hyperactive"]
        },
        
        # Depression-related symptoms
        {
            "name": "Depressed Mood",
            "description": "Persistent feelings of sadness, emptiness, or hopelessness",
            "categories": ["ICD11-6A70", "ICD11-6A71"],  # Depressive disorders
            "aliases": ["Sadness", "Low mood", "Melancholy"],
            "tags": ["depressed", "sad", "low", "down", "blue"]
        },
        {
            "name": "Anhedonia",
            "description": "Markedly diminished interest or pleasure in all, or almost all, activities",
            "categories": ["ICD11-6A70"],  # Single episode depressive disorder
            "aliases": ["Loss of interest", "No pleasure", "Apathy"],
            "tags": ["anhedonia", "no interest", "no pleasure", "apathy"]
        },
        {
            "name": "Hopelessness",
            "description": "Feeling that nothing will improve or that there's no solution to problems",
            "categories": ["ICD11-6A70", "ICD11-6A71"],
            "aliases": ["Despair", "No hope", "Pessimism"],
            "tags": ["hopeless", "despair", "pessimistic", "no future"]
        },
        {
            "name": "Worthlessness",
            "description": "Feelings of being worthless or excessive inappropriate guilt",
            "categories": ["ICD11-6A70", "ICD11-6A71"],
            "aliases": ["Low self-worth", "Self-blame", "Guilt"],
            "tags": ["worthless", "guilt", "blame", "inadequate"]
        },
        
        # Sleep-related symptoms
        {
            "name": "Insomnia",
            "description": "Difficulty falling asleep, staying asleep, or waking up too early",
            "categories": ["ICD11-7A00"],  # Sleep-wake disorders
            "aliases": ["Sleep problems", "Can't sleep", "Sleeplessness"],
            "tags": ["insomnia", "sleep", "awake", "tired", "exhausted"]
        },
        {
            "name": "Hypersomnia",
            "description": "Excessive sleepiness during the day or sleeping too much",
            "categories": ["ICD11-7A01"],
            "aliases": ["Sleeping too much", "Excessive sleep", "Daytime sleepiness"],
            "tags": ["hypersomnia", "sleepy", "tired", "fatigue"]
        },
        {
            "name": "Fatigue",
            "description": "Persistent tiredness or lack of energy not relieved by rest",
            "categories": ["ICD11-6A70", "ICD11-6A71", "ICD11-MB23"],
            "aliases": ["Tiredness", "Exhaustion", "Low energy"],
            "tags": ["fatigue", "tired", "exhausted", "energy", "weak"]
        },
        
        # Mood symptoms
        {
            "name": "Mood Swings",
            "description": "Rapid or extreme changes in emotional state",
            "categories": ["ICD11-6A60"],  # Bipolar disorders
            "aliases": ["Emotional instability", "Mood changes"],
            "tags": ["mood", "swings", "emotional", "unstable", "changes"]
        },
        {
            "name": "Irritability",
            "description": "Easily annoyed or made angry, low tolerance for frustration",
            "categories": ["ICD11-6A60", "ICD11-6A70", "ICD11-6B00"],
            "aliases": ["Anger", "Short temper", "Easily annoyed"],
            "tags": ["irritable", "angry", "annoyed", "temper", "frustrated"]
        },
        
        # Cognitive symptoms
        {
            "name": "Concentration Problems",
            "description": "Difficulty focusing, paying attention, or making decisions",
            "categories": ["ICD11-6A70", "ICD11-6A00"],  # Depression, ADHD
            "aliases": ["Focus problems", "Attention deficit", "Can't concentrate"],
            "tags": ["concentration", "focus", "attention", "distracted", "forgetful"]
        },
        {
            "name": "Memory Problems",
            "description": "Difficulty remembering things or forgetfulness",
            "categories": ["ICD11-6A70", "ICD11-6D80"],
            "aliases": ["Forgetfulness", "Memory loss", "Can't remember"],
            "tags": ["memory", "forgetful", "forget", "remember"]
        },
        {
            "name": "Indecisiveness",
            "description": "Difficulty making decisions or persistent doubt about choices made",
            "categories": ["ICD11-6A70", "ICD11-6B00"],
            "aliases": ["Can't decide", "Doubt", "Uncertainty"],
            "tags": ["indecisive", "doubt", "uncertain", "decisions"]
        },
        
        # Social/interpersonal symptoms
        {
            "name": "Social Withdrawal",
            "description": "Avoiding social interactions or isolating oneself from others",
            "categories": ["ICD11-6A70", "ICD11-6A02"],  # Depression, Social anxiety
            "aliases": ["Isolation", "Avoiding people", "Social isolation"],
            "tags": ["withdrawn", "isolated", "avoid", "social", "alone"]
        },
        {
            "name": "Social Anxiety",
            "description": "Fear or anxiety in social situations or when being observed by others",
            "categories": ["ICD11-6B02"],  # Social anxiety disorder
            "aliases": ["Social fear", "Performance anxiety", "Shyness"],
            "tags": ["social", "anxiety", "fear", "embarrassed", "judged"]
        },
        
        # Physical symptoms often associated with mental health
        {
            "name": "Appetite Changes",
            "description": "Significant increase or decrease in appetite or food intake",
            "categories": ["ICD11-6A70", "ICD11-6C50"],  # Depression, eating disorders
            "aliases": ["Eating problems", "Loss of appetite", "Overeating"],
            "tags": ["appetite", "eating", "food", "hungry", "weight"]
        },
        {
            "name": "Psychomotor Agitation",
            "description": "Physical restlessness with purposeless movement or activity",
            "categories": ["ICD11-6A70", "ICD11-6A60"],
            "aliases": ["Physical restlessness", "Agitation", "Hyperactivity"],
            "tags": ["agitated", "restless", "hyperactive", "moving", "fidgety"]
        },
        {
            "name": "Psychomotor Retardation",
            "description": "Slowing of physical movements, speech, and thought processes",
            "categories": ["ICD11-6A70"],
            "aliases": ["Slowed down", "Sluggish", "Moving slowly"],
            "tags": ["slow", "sluggish", "retarded", "delayed", "heavy"]
        },
        
        # Trauma-related symptoms
        {
            "name": "Intrusive Thoughts",
            "description": "Unwanted, distressing thoughts or memories that repeatedly enter consciousness",
            "categories": ["ICD11-6B40", "ICD11-6B41"],  # PTSD, Complex PTSD
            "aliases": ["Unwanted thoughts", "Disturbing memories", "Flashbacks"],
            "tags": ["intrusive", "thoughts", "memories", "flashbacks", "unwanted"]
        },
        {
            "name": "Hypervigilance",
            "description": "State of enhanced alertness and scanning for threats or danger",
            "categories": ["ICD11-6B40", "ICD11-6B41"],
            "aliases": ["Over-alertness", "Always on guard", "Scanning for danger"],
            "tags": ["hypervigilant", "alert", "danger", "threat", "watchful"]
        }
    ]
    
    db = SessionLocal()
    try:
        print("Creating master symptoms...")
        
        for symptom_data in master_symptoms_data:
            # Check if symptom already exists
            existing = db.query(MasterSymptom).filter(
                MasterSymptom.name == symptom_data["name"]
            ).first()
            
            if existing:
                print(f"  Symptom '{symptom_data['name']}' already exists, skipping...")
                continue
            
            # Create new master symptom
            symptom = MasterSymptom(
                name=symptom_data["name"],
                description=symptom_data["description"],
                categories=symptom_data["categories"],
                aliases=symptom_data["aliases"],
                tags=symptom_data["tags"]
            )
            
            db.add(symptom)
            print(f"  Created symptom: {symptom_data['name']}")
        
        db.commit()
        print(f"Successfully created master symptoms!")
        
        # Print summary
        total_symptoms = db.query(MasterSymptom).filter(MasterSymptom.is_active == 1).count()
        print(f"Total master symptoms in database: {total_symptoms}")
        
    except Exception as e:
        print(f"Error creating master symptoms: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_master_symptoms()
