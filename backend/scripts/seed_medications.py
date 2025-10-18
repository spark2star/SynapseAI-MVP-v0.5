#!/usr/bin/env python3
"""
Seed script for psychiatric medications database.
Inserts 7 common psychiatric medications with their standard dosages.
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.medication import Medication


def seed_medications(db: Session):
    """Seed the medications table with common psychiatric medications."""
    
    medications_data = [
        # SSRIs (Selective Serotonin Reuptake Inhibitors)
        {
            "name": "Sertraline",
            "generic_name": "Sertraline Hydrochloride",
            "common_dosages": ["25mg", "50mg", "100mg", "150mg", "200mg"]
        },
        {
            "name": "Escitalopram",
            "generic_name": "Escitalopram Oxalate",
            "common_dosages": ["5mg", "10mg", "15mg", "20mg"]
        },
        {
            "name": "Fluoxetine",
            "generic_name": "Fluoxetine Hydrochloride",
            "common_dosages": ["10mg", "20mg", "40mg", "60mg"]
        },
        {
            "name": "Paroxetine",
            "generic_name": "Paroxetine Hydrochloride",
            "common_dosages": ["10mg", "20mg", "30mg", "40mg"]
        },
        {
            "name": "Fluvoxamine",
            "generic_name": "Fluvoxamine Maleate",
            "common_dosages": ["50mg", "100mg"]
        },
        {
            "name": "Citalopram",
            "generic_name": "Citalopram Hydrobromide",
            "common_dosages": ["10mg", "20mg", "40mg"]
        },
        
        # SNRIs (Serotonin-Norepinephrine Reuptake Inhibitors)
        {
            "name": "Venlafaxine",
            "generic_name": "Venlafaxine Hydrochloride",
            "common_dosages": ["37.5mg", "75mg", "150mg", "225mg"]
        },
        {
            "name": "Duloxetine",
            "generic_name": "Duloxetine Hydrochloride",
            "common_dosages": ["20mg", "30mg", "40mg", "60mg"]
        },
        {
            "name": "Desvenlafaxine",
            "generic_name": "Desvenlafaxine Succinate",
            "common_dosages": ["25mg", "50mg", "100mg"]
        },
        
        # Tricyclic Antidepressants (TCAs)
        {
            "name": "Amitriptyline",
            "generic_name": "Amitriptyline Hydrochloride",
            "common_dosages": ["10mg", "25mg", "50mg", "75mg"]
        },
        {
            "name": "Imipramine",
            "generic_name": "Imipramine Hydrochloride",
            "common_dosages": ["25mg", "50mg", "75mg"]
        },
        {
            "name": "Clomipramine",
            "generic_name": "Clomipramine Hydrochloride",
            "common_dosages": ["25mg", "50mg", "75mg"]
        },
        {
            "name": "Nortriptyline",
            "generic_name": "Nortriptyline Hydrochloride",
            "common_dosages": ["10mg", "25mg", "50mg"]
        },
        
        # Benzodiazepines
        {
            "name": "Alprazolam",
            "generic_name": "Alprazolam",
            "common_dosages": ["0.25mg", "0.5mg", "1mg", "2mg"]
        },
        {
            "name": "Clonazepam",
            "generic_name": "Clonazepam",
            "common_dosages": ["0.25mg", "0.5mg", "1mg", "2mg"]
        },
        {
            "name": "Lorazepam",
            "generic_name": "Lorazepam",
            "common_dosages": ["0.5mg", "1mg", "2mg"]
        },
        {
            "name": "Diazepam",
            "generic_name": "Diazepam",
            "common_dosages": ["2mg", "5mg", "10mg"]
        },
        {
            "name": "Etizolam",
            "generic_name": "Etizolam",
            "common_dosages": ["0.25mg", "0.5mg", "1mg"]
        },
        {
            "name": "Nitrazepam",
            "generic_name": "Nitrazepam",
            "common_dosages": ["5mg", "10mg"]
        },
        
        # Atypical Antipsychotics
        {
            "name": "Risperidone",
            "generic_name": "Risperidone",
            "common_dosages": ["0.5mg", "1mg", "2mg", "3mg", "4mg"]
        },
        {
            "name": "Olanzapine",
            "generic_name": "Olanzapine",
            "common_dosages": ["2.5mg", "5mg", "7.5mg", "10mg", "15mg", "20mg"]
        },
        {
            "name": "Quetiapine",
            "generic_name": "Quetiapine Fumarate",
            "common_dosages": ["25mg", "50mg", "100mg", "200mg", "300mg"]
        },
        {
            "name": "Aripiprazole",
            "generic_name": "Aripiprazole",
            "common_dosages": ["5mg", "10mg", "15mg", "20mg", "30mg"]
        },
        {
            "name": "Amisulpride",
            "generic_name": "Amisulpride",
            "common_dosages": ["50mg", "100mg", "200mg", "400mg"]
        },
        {
            "name": "Paliperidone",
            "generic_name": "Paliperidone",
            "common_dosages": ["3mg", "6mg", "9mg"]
        },
        {
            "name": "Ziprasidone",
            "generic_name": "Ziprasidone Hydrochloride",
            "common_dosages": ["20mg", "40mg", "60mg", "80mg"]
        },
        {
            "name": "Lurasidone",
            "generic_name": "Lurasidone Hydrochloride",
            "common_dosages": ["20mg", "40mg", "80mg"]
        },
        {
            "name": "Clozapine",
            "generic_name": "Clozapine",
            "common_dosages": ["25mg", "50mg", "100mg"]
        },
        
        # Typical Antipsychotics
        {
            "name": "Haloperidol",
            "generic_name": "Haloperidol",
            "common_dosages": ["0.5mg", "1mg", "2mg", "5mg", "10mg"]
        },
        {
            "name": "Chlorpromazine",
            "generic_name": "Chlorpromazine Hydrochloride",
            "common_dosages": ["25mg", "50mg", "100mg"]
        },
        {
            "name": "Trifluoperazine",
            "generic_name": "Trifluoperazine Hydrochloride",
            "common_dosages": ["1mg", "5mg", "10mg"]
        },
        
        # Mood Stabilizers
        {
            "name": "Lithium",
            "generic_name": "Lithium Carbonate",
            "common_dosages": ["300mg", "400mg"]
        },
        {
            "name": "Valproate",
            "generic_name": "Sodium Valproate",
            "common_dosages": ["200mg", "300mg", "500mg"]
        },
        {
            "name": "Carbamazepine",
            "generic_name": "Carbamazepine",
            "common_dosages": ["100mg", "200mg", "400mg"]
        },
        {
            "name": "Lamotrigine",
            "generic_name": "Lamotrigine",
            "common_dosages": ["25mg", "50mg", "100mg", "200mg"]
        },
        {
            "name": "Oxcarbazepine",
            "generic_name": "Oxcarbazepine",
            "common_dosages": ["150mg", "300mg", "600mg"]
        },
        
        # Stimulants (ADHD)
        {
            "name": "Methylphenidate",
            "generic_name": "Methylphenidate Hydrochloride",
            "common_dosages": ["5mg", "10mg", "20mg"]
        },
        {
            "name": "Atomoxetine",
            "generic_name": "Atomoxetine Hydrochloride",
            "common_dosages": ["10mg", "18mg", "25mg", "40mg", "60mg"]
        },
        
        # Other Antidepressants
        {
            "name": "Mirtazapine",
            "generic_name": "Mirtazapine",
            "common_dosages": ["7.5mg", "15mg", "30mg", "45mg"]
        },
        {
            "name": "Bupropion",
            "generic_name": "Bupropion Hydrochloride",
            "common_dosages": ["75mg", "100mg", "150mg", "300mg"]
        },
        {
            "name": "Trazodone",
            "generic_name": "Trazodone Hydrochloride",
            "common_dosages": ["25mg", "50mg", "100mg"]
        },
        {
            "name": "Agomelatine",
            "generic_name": "Agomelatine",
            "common_dosages": ["25mg", "50mg"]
        },
        
        # Anxiolytics (Non-Benzodiazepine)
        {
            "name": "Buspirone",
            "generic_name": "Buspirone Hydrochloride",
            "common_dosages": ["5mg", "10mg", "15mg"]
        },
        {
            "name": "Hydroxyzine",
            "generic_name": "Hydroxyzine Hydrochloride",
            "common_dosages": ["10mg", "25mg", "50mg"]
        },
        {
            "name": "Propranolol",
            "generic_name": "Propranolol Hydrochloride",
            "common_dosages": ["10mg", "20mg", "40mg"]
        },
        
        # Sleep Medications
        {
            "name": "Zolpidem",
            "generic_name": "Zolpidem Tartrate",
            "common_dosages": ["5mg", "10mg"]
        },
        {
            "name": "Zopiclone",
            "generic_name": "Zopiclone",
            "common_dosages": ["3.75mg", "7.5mg"]
        },
        {
            "name": "Eszopiclone",
            "generic_name": "Eszopiclone",
            "common_dosages": ["1mg", "2mg", "3mg"]
        },
        {
            "name": "Melatonin",
            "generic_name": "Melatonin",
            "common_dosages": ["1mg", "3mg", "5mg", "10mg"]
        },
        
        # Anticholinergics (for EPS)
        {
            "name": "Trihexyphenidyl",
            "generic_name": "Trihexyphenidyl Hydrochloride",
            "common_dosages": ["2mg", "5mg"]
        },
        {
            "name": "Procyclidine",
            "generic_name": "Procyclidine Hydrochloride",
            "common_dosages": ["5mg"]
        },
        
        # Cognitive Enhancers
        {
            "name": "Donepezil",
            "generic_name": "Donepezil Hydrochloride",
            "common_dosages": ["5mg", "10mg"]
        },
        {
            "name": "Memantine",
            "generic_name": "Memantine Hydrochloride",
            "common_dosages": ["5mg", "10mg", "20mg"]
        },
        {
            "name": "Rivastigmine",
            "generic_name": "Rivastigmine Tartrate",
            "common_dosages": ["1.5mg", "3mg", "4.5mg", "6mg"]
        }
    ]
    
    print("Starting medication seeding...")
    
    for med_data in medications_data:
        # Check if medication already exists
        existing = db.query(Medication).filter(
            Medication.name == med_data["name"]
        ).first()
        
        if existing:
            print(f"  ⚠️  Medication '{med_data['name']}' already exists, skipping...")
            continue
        
        # Create new medication
        medication = Medication(
            name=med_data["name"],
            generic_name=med_data["generic_name"],
            common_dosages=med_data["common_dosages"]
        )
        
        db.add(medication)
        print(f"  ✓ Added medication: {med_data['name']} with dosages {med_data['common_dosages']}")
    
    db.commit()
    print("\n✅ Medication seeding completed successfully!")


def main():
    """Main function to run the seed script."""
    print("=" * 60)
    print("Psychiatric Medications Seed Script")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        seed_medications(db)
    except Exception as e:
        print(f"\n❌ Error seeding medications: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
    
    print("\nDatabase seeding complete. You can now use the medication autocomplete feature.")


if __name__ == "__main__":
    main()
