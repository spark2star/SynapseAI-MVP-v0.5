#!/usr/bin/env python3
"""Seed master symptoms database"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.symptom import MasterSymptom
import uuid

def seed_symptoms():
    db = SessionLocal()
    
    try:
        # Check if already populated
        count = db.query(MasterSymptom).count()
        if count > 0:
            print(f"✅ Database already has {count} symptoms")
            return
        
        symptoms = [
            # Mood Symptoms
            {"name": "Mania", "description": "Elevated mood, increased energy", "categories": ["Mood"], "is_active": 1},
            {"name": "Manic Episode", "description": "Distinct period of abnormally elevated mood", "categories": ["Mood"], "is_active": 1},
            {"name": "Depression", "description": "Persistent sad or low mood", "categories": ["Mood"], "is_active": 1},
            {"name": "Depressive Episode", "description": "Period of depressed mood or loss of interest", "categories": ["Mood"], "is_active": 1},
            {"name": "Anxiety", "description": "Excessive worry or fear", "categories": ["Mood"], "is_active": 1},
            {"name": "Panic Attack", "description": "Sudden intense fear with physical symptoms", "categories": ["Mood"], "is_active": 1},
            {"name": "Irritability", "description": "Easily annoyed or angered", "categories": ["Mood"], "is_active": 1},
            {"name": "Suicidal Thoughts", "description": "Thoughts of self-harm or suicide", "categories": ["Mood"], "is_active": 1},
            
            # ADHD & Attention
            {"name": "ADHD", "description": "Attention-Deficit/Hyperactivity Disorder", "categories": ["Attention", "Neurodevelopmental"], "aliases": ["ADD", "Attention Deficit"], "is_active": 1},
            {"name": "Attention Deficit", "description": "Difficulty maintaining focus", "categories": ["Attention"], "is_active": 1},
            {"name": "Hyperactivity", "description": "Excessive physical activity or restlessness", "categories": ["Attention"], "is_active": 1},
            {"name": "Impulsivity", "description": "Acting without thinking", "categories": ["Attention"], "is_active": 1},
            {"name": "Difficulty Concentrating", "description": "Unable to maintain focus on tasks", "categories": ["Attention", "Cognitive"], "is_active": 1},
            {"name": "Inattention", "description": "Lack of attention or focus", "categories": ["Attention"], "is_active": 1},
            
            # Sleep
            {"name": "Insomnia", "description": "Difficulty falling or staying asleep", "categories": ["Sleep"], "is_active": 1},
            {"name": "Hypersomnia", "description": "Excessive sleepiness", "categories": ["Sleep"], "is_active": 1},
            
            # Physical
            {"name": "Fatigue", "description": "Extreme tiredness", "categories": ["Physical"], "is_active": 1},
            {"name": "Loss of Energy", "description": "Decreased physical or mental energy", "categories": ["Physical"], "is_active": 1},
            {"name": "Restlessness", "description": "Inability to stay still or calm", "categories": ["Physical"], "is_active": 1},
            {"name": "Loss of Appetite", "description": "Decreased desire to eat", "categories": ["Physical"], "is_active": 1},
            {"name": "Weight Loss", "description": "Unintentional decrease in body weight", "categories": ["Physical"], "is_active": 1},
            {"name": "Weight Gain", "description": "Unintentional increase in body weight", "categories": ["Physical"], "is_active": 1},
            
            # Psychotic
            {"name": "Hallucinations", "description": "Seeing or hearing things that aren't there", "categories": ["Psychotic"], "is_active": 1},
            {"name": "Delusions", "description": "Fixed false beliefs", "categories": ["Psychotic"], "is_active": 1},
            {"name": "Paranoia", "description": "Irrational suspicion or mistrust", "categories": ["Psychotic"], "is_active": 1},
        ]
        
        for symptom_data in symptoms:
            symptom = MasterSymptom(
                id=str(uuid.uuid4()),
                **symptom_data
            )
            db.add(symptom)
        
        db.commit()
        print(f"✅ Successfully seeded {len(symptoms)} symptoms!")
        
    except Exception as e:
        print(f"❌ Error seeding symptoms: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_symptoms()
