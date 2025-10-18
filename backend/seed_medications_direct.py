#!/usr/bin/env python3
"""
Direct medication seeding script that can be run from the backend directory.
Usage: python seed_medications_direct.py
"""
import os
import sys

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.medication import Medication

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
    },
    
    # ========================================================================
    # BRAND NAMES (Popular in India)
    # ========================================================================
    
    # SSRI Brand Names
    {
        "name": "Zoloft",
        "generic_name": "Sertraline Hydrochloride",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Daxid",
        "generic_name": "Sertraline Hydrochloride",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Serlift",
        "generic_name": "Sertraline Hydrochloride",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Sertima",
        "generic_name": "Sertraline Hydrochloride",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Zosert",
        "generic_name": "Sertraline Hydrochloride",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Lexapro",
        "generic_name": "Escitalopram Oxalate",
        "common_dosages": ["5mg", "10mg", "20mg"]
    },
    {
        "name": "Nexito",
        "generic_name": "Escitalopram Oxalate",
        "common_dosages": ["5mg", "10mg", "20mg"]
    },
    {
        "name": "Stalopam",
        "generic_name": "Escitalopram Oxalate",
        "common_dosages": ["5mg", "10mg", "20mg"]
    },
    {
        "name": "Feliz",
        "generic_name": "Escitalopram Oxalate",
        "common_dosages": ["5mg", "10mg", "20mg"]
    },
    {
        "name": "Rexipra",
        "generic_name": "Escitalopram Oxalate",
        "common_dosages": ["5mg", "10mg", "20mg"]
    },
    {
        "name": "Prozac",
        "generic_name": "Fluoxetine Hydrochloride",
        "common_dosages": ["10mg", "20mg", "40mg", "60mg"]
    },
    {
        "name": "Fludac",
        "generic_name": "Fluoxetine Hydrochloride",
        "common_dosages": ["10mg", "20mg", "40mg", "60mg"]
    },
    {
        "name": "Flunil",
        "generic_name": "Fluoxetine Hydrochloride",
        "common_dosages": ["10mg", "20mg", "40mg", "60mg"]
    },
    {
        "name": "Prodep",
        "generic_name": "Fluoxetine Hydrochloride",
        "common_dosages": ["10mg", "20mg", "40mg"]
    },
    {
        "name": "Paxil",
        "generic_name": "Paroxetine Hydrochloride",
        "common_dosages": ["10mg", "20mg", "30mg", "40mg"]
    },
    {
        "name": "Pari",
        "generic_name": "Paroxetine Hydrochloride",
        "common_dosages": ["12.5mg", "25mg"]
    },
    {
        "name": "Parox",
        "generic_name": "Paroxetine Hydrochloride",
        "common_dosages": ["12.5mg", "25mg"]
    },
    {
        "name": "Pexep",
        "generic_name": "Paroxetine Hydrochloride",
        "common_dosages": ["12.5mg", "25mg", "37.5mg"]
    },
    {
        "name": "Faverin",
        "generic_name": "Fluvoxamine Maleate",
        "common_dosages": ["50mg", "100mg"]
    },
    {
        "name": "Celexa",
        "generic_name": "Citalopram Hydrobromide",
        "common_dosages": ["10mg", "20mg", "40mg"]
    },
    {
        "name": "Citadep",
        "generic_name": "Citalopram Hydrobromide",
        "common_dosages": ["10mg", "20mg", "40mg"]
    },
    
    # SNRI Brand Names
    {
        "name": "Effexor",
        "generic_name": "Venlafaxine Hydrochloride",
        "common_dosages": ["37.5mg", "75mg", "150mg"]
    },
    {
        "name": "Venlor",
        "generic_name": "Venlafaxine Hydrochloride",
        "common_dosages": ["37.5mg", "75mg", "150mg"]
    },
    {
        "name": "Veniz",
        "generic_name": "Venlafaxine Hydrochloride",
        "common_dosages": ["37.5mg", "75mg", "150mg"]
    },
    {
        "name": "Venlift",
        "generic_name": "Venlafaxine Hydrochloride",
        "common_dosages": ["37.5mg", "75mg", "150mg"]
    },
    {
        "name": "Cymbalta",
        "generic_name": "Duloxetine Hydrochloride",
        "common_dosages": ["20mg", "30mg", "40mg", "60mg"]
    },
    {
        "name": "Duzela",
        "generic_name": "Duloxetine Hydrochloride",
        "common_dosages": ["20mg", "30mg", "40mg", "60mg"]
    },
    {
        "name": "Dulotin",
        "generic_name": "Duloxetine Hydrochloride",
        "common_dosages": ["20mg", "30mg", "40mg", "60mg"]
    },
    {
        "name": "Dulane",
        "generic_name": "Duloxetine Hydrochloride",
        "common_dosages": ["20mg", "30mg", "40mg", "60mg"]
    },
    {
        "name": "Pristiq",
        "generic_name": "Desvenlafaxine Succinate",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    
    # TCA Brand Names
    {
        "name": "Elavil",
        "generic_name": "Amitriptyline Hydrochloride",
        "common_dosages": ["10mg", "25mg", "50mg", "75mg"]
    },
    {
        "name": "Tryptomer",
        "generic_name": "Amitriptyline Hydrochloride",
        "common_dosages": ["10mg", "25mg", "50mg"]
    },
    {
        "name": "Amitone",
        "generic_name": "Amitriptyline Hydrochloride",
        "common_dosages": ["10mg", "25mg", "50mg"]
    },
    {
        "name": "Amitryn",
        "generic_name": "Amitriptyline Hydrochloride",
        "common_dosages": ["10mg", "25mg", "50mg"]
    },
    {
        "name": "Tofranil",
        "generic_name": "Imipramine Hydrochloride",
        "common_dosages": ["25mg", "50mg", "75mg"]
    },
    {
        "name": "Anafranil",
        "generic_name": "Clomipramine Hydrochloride",
        "common_dosages": ["25mg", "50mg", "75mg"]
    },
    {
        "name": "Clonil",
        "generic_name": "Clomipramine Hydrochloride",
        "common_dosages": ["25mg", "50mg", "75mg"]
    },
    
    # Benzodiazepine Brand Names
    {
        "name": "Xanax",
        "generic_name": "Alprazolam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg"]
    },
    {
        "name": "Alprax",
        "generic_name": "Alprazolam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg"]
    },
    {
        "name": "Restyl",
        "generic_name": "Alprazolam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg"]
    },
    {
        "name": "Alzolam",
        "generic_name": "Alprazolam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg"]
    },
    {
        "name": "Zolax",
        "generic_name": "Alprazolam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg"]
    },
    {
        "name": "Klonopin",
        "generic_name": "Clonazepam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg", "2mg"]
    },
    {
        "name": "Lonazep",
        "generic_name": "Clonazepam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg", "2mg"]
    },
    {
        "name": "Clonotril",
        "generic_name": "Clonazepam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg", "2mg"]
    },
    {
        "name": "Rivotril",
        "generic_name": "Clonazepam",
        "common_dosages": ["0.5mg", "1mg", "2mg"]
    },
    {
        "name": "Zapiz",
        "generic_name": "Clonazepam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg", "2mg"]
    },
    {
        "name": "Ativan",
        "generic_name": "Lorazepam",
        "common_dosages": ["0.5mg", "1mg", "2mg"]
    },
    {
        "name": "Lorazep",
        "generic_name": "Lorazepam",
        "common_dosages": ["1mg", "2mg"]
    },
    {
        "name": "Valium",
        "generic_name": "Diazepam",
        "common_dosages": ["2mg", "5mg", "10mg"]
    },
    {
        "name": "Calmpose",
        "generic_name": "Diazepam",
        "common_dosages": ["5mg", "10mg"]
    },
    {
        "name": "Etilaam",
        "generic_name": "Etizolam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg"]
    },
    {
        "name": "Etizola",
        "generic_name": "Etizolam",
        "common_dosages": ["0.25mg", "0.5mg", "1mg"]
    },
    {
        "name": "Nitrosun",
        "generic_name": "Nitrazepam",
        "common_dosages": ["5mg", "10mg"]
    },
    
    # Atypical Antipsychotic Brand Names
    {
        "name": "Risperdal",
        "generic_name": "Risperidone",
        "common_dosages": ["1mg", "2mg", "3mg", "4mg"]
    },
    {
        "name": "Risdone",
        "generic_name": "Risperidone",
        "common_dosages": ["1mg", "2mg", "3mg", "4mg"]
    },
    {
        "name": "Risnia",
        "generic_name": "Risperidone",
        "common_dosages": ["1mg", "2mg", "3mg", "4mg"]
    },
    {
        "name": "Rizodal",
        "generic_name": "Risperidone",
        "common_dosages": ["0.5mg", "1mg", "2mg", "3mg"]
    },
    {
        "name": "Zyprexa",
        "generic_name": "Olanzapine",
        "common_dosages": ["2.5mg", "5mg", "7.5mg", "10mg"]
    },
    {
        "name": "Olipar",
        "generic_name": "Olanzapine",
        "common_dosages": ["2.5mg", "5mg", "7.5mg", "10mg"]
    },
    {
        "name": "Oleanz",
        "generic_name": "Olanzapine",
        "common_dosages": ["2.5mg", "5mg", "10mg"]
    },
    {
        "name": "Olanex",
        "generic_name": "Olanzapine",
        "common_dosages": ["2.5mg", "5mg", "7.5mg", "10mg"]
    },
    {
        "name": "Oltha",
        "generic_name": "Olanzapine",
        "common_dosages": ["2.5mg", "5mg", "10mg"]
    },
    {
        "name": "Seroquel",
        "generic_name": "Quetiapine Fumarate",
        "common_dosages": ["25mg", "50mg", "100mg", "200mg", "300mg"]
    },
    {
        "name": "Qutan",
        "generic_name": "Quetiapine Fumarate",
        "common_dosages": ["25mg", "50mg", "100mg", "200mg"]
    },
    {
        "name": "Qutipin",
        "generic_name": "Quetiapine Fumarate",
        "common_dosages": ["25mg", "50mg", "100mg", "200mg", "300mg"]
    },
    {
        "name": "Qulip",
        "generic_name": "Quetiapine Fumarate",
        "common_dosages": ["25mg", "50mg", "100mg", "200mg"]
    },
    {
        "name": "Abilify",
        "generic_name": "Aripiprazole",
        "common_dosages": ["5mg", "10mg", "15mg", "20mg", "30mg"]
    },
    {
        "name": "Aripzo",
        "generic_name": "Aripiprazole",
        "common_dosages": ["10mg", "15mg", "20mg"]
    },
    {
        "name": "Apiz",
        "generic_name": "Aripiprazole",
        "common_dosages": ["5mg", "10mg", "15mg", "20mg"]
    },
    {
        "name": "Arip",
        "generic_name": "Aripiprazole",
        "common_dosages": ["10mg", "15mg", "20mg", "30mg"]
    },
    {
        "name": "Solian",
        "generic_name": "Amisulpride",
        "common_dosages": ["50mg", "100mg", "200mg"]
    },
    {
        "name": "Invega",
        "generic_name": "Paliperidone",
        "common_dosages": ["3mg", "6mg", "9mg"]
    },
    {
        "name": "Geodon",
        "generic_name": "Ziprasidone Hydrochloride",
        "common_dosages": ["20mg", "40mg", "80mg"]
    },
    {
        "name": "Latuda",
        "generic_name": "Lurasidone Hydrochloride",
        "common_dosages": ["20mg", "40mg", "80mg"]
    },
    {
        "name": "Clozaril",
        "generic_name": "Clozapine",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Sizopin",
        "generic_name": "Clozapine",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    
    # Typical Antipsychotic Brand Names
    {
        "name": "Haldol",
        "generic_name": "Haloperidol",
        "common_dosages": ["0.5mg", "1mg", "5mg", "10mg"]
    },
    {
        "name": "Serenace",
        "generic_name": "Haloperidol",
        "common_dosages": ["0.5mg", "1.5mg", "5mg", "10mg"]
    },
    {
        "name": "Largactil",
        "generic_name": "Chlorpromazine Hydrochloride",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Stelazine",
        "generic_name": "Trifluoperazine Hydrochloride",
        "common_dosages": ["1mg", "5mg", "10mg"]
    },
    
    # Mood Stabilizer Brand Names
    {
        "name": "Lithosun",
        "generic_name": "Lithium Carbonate",
        "common_dosages": ["300mg", "400mg"]
    },
    {
        "name": "Licab",
        "generic_name": "Lithium Carbonate",
        "common_dosages": ["300mg", "400mg"]
    },
    {
        "name": "Depakote",
        "generic_name": "Sodium Valproate",
        "common_dosages": ["200mg", "300mg", "500mg"]
    },
    {
        "name": "Valprol",
        "generic_name": "Sodium Valproate",
        "common_dosages": ["200mg", "300mg", "500mg"]
    },
    {
        "name": "Tegretol",
        "generic_name": "Carbamazepine",
        "common_dosages": ["100mg", "200mg", "400mg"]
    },
    {
        "name": "Tegrital",
        "generic_name": "Carbamazepine",
        "common_dosages": ["100mg", "200mg", "400mg"]
    },
    {
        "name": "Lamictal",
        "generic_name": "Lamotrigine",
        "common_dosages": ["25mg", "50mg", "100mg", "200mg"]
    },
    {
        "name": "Lamitor",
        "generic_name": "Lamotrigine",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Trileptal",
        "generic_name": "Oxcarbazepine",
        "common_dosages": ["150mg", "300mg", "600mg"]
    },
    {
        "name": "Oxetol",
        "generic_name": "Oxcarbazepine",
        "common_dosages": ["150mg", "300mg", "600mg"]
    },
    
    # ADHD Brand Names
    {
        "name": "Ritalin",
        "generic_name": "Methylphenidate Hydrochloride",
        "common_dosages": ["5mg", "10mg", "20mg"]
    },
    {
        "name": "Inspiral",
        "generic_name": "Methylphenidate Hydrochloride",
        "common_dosages": ["10mg", "20mg"]
    },
    {
        "name": "Methylin",
        "generic_name": "Methylphenidate Hydrochloride",
        "common_dosages": ["5mg", "10mg", "20mg"]
    },
    {
        "name": "Strattera",
        "generic_name": "Atomoxetine Hydrochloride",
        "common_dosages": ["10mg", "18mg", "25mg", "40mg", "60mg"]
    },
    {
        "name": "Axepta",
        "generic_name": "Atomoxetine Hydrochloride",
        "common_dosages": ["10mg", "18mg", "25mg", "40mg", "60mg"]
    },
    {
        "name": "Attentrol",
        "generic_name": "Atomoxetine Hydrochloride",
        "common_dosages": ["10mg", "18mg", "25mg", "40mg"]
    },
    {
        "name": "Tomoxetin",
        "generic_name": "Atomoxetine Hydrochloride",
        "common_dosages": ["10mg", "18mg", "25mg", "40mg", "60mg"]
    },
    
    # Other Antidepressant Brand Names
    {
        "name": "Remeron",
        "generic_name": "Mirtazapine",
        "common_dosages": ["7.5mg", "15mg", "30mg", "45mg"]
    },
    {
        "name": "Mirtaz",
        "generic_name": "Mirtazapine",
        "common_dosages": ["7.5mg", "15mg", "30mg"]
    },
    {
        "name": "Mirnite",
        "generic_name": "Mirtazapine",
        "common_dosages": ["7.5mg", "15mg", "30mg"]
    },
    {
        "name": "Mirtadep",
        "generic_name": "Mirtazapine",
        "common_dosages": ["7.5mg", "15mg", "30mg", "45mg"]
    },
    {
        "name": "Wellbutrin",
        "generic_name": "Bupropion Hydrochloride",
        "common_dosages": ["150mg", "300mg"]
    },
    {
        "name": "Desyrel",
        "generic_name": "Trazodone Hydrochloride",
        "common_dosages": ["25mg", "50mg", "100mg"]
    },
    {
        "name": "Valdoxan",
        "generic_name": "Agomelatine",
        "common_dosages": ["25mg", "50mg"]
    },
    
    # Anxiolytic Brand Names
    {
        "name": "Buspar",
        "generic_name": "Buspirone Hydrochloride",
        "common_dosages": ["5mg", "10mg", "15mg"]
    },
    {
        "name": "Atarax",
        "generic_name": "Hydroxyzine Hydrochloride",
        "common_dosages": ["10mg", "25mg"]
    },
    {
        "name": "Inderal",
        "generic_name": "Propranolol Hydrochloride",
        "common_dosages": ["10mg", "20mg", "40mg"]
    },
    
    # Sleep Medication Brand Names
    {
        "name": "Ambien",
        "generic_name": "Zolpidem Tartrate",
        "common_dosages": ["5mg", "10mg"]
    },
    {
        "name": "Zolfresh",
        "generic_name": "Zolpidem Tartrate",
        "common_dosages": ["5mg", "10mg"]
    },
    {
        "name": "Imovane",
        "generic_name": "Zopiclone",
        "common_dosages": ["3.75mg", "7.5mg"]
    },
    {
        "name": "Lunesta",
        "generic_name": "Eszopiclone",
        "common_dosages": ["1mg", "2mg", "3mg"]
    },
    
    # Anticholinergic Brand Names
    {
        "name": "Pacitane",
        "generic_name": "Trihexyphenidyl Hydrochloride",
        "common_dosages": ["2mg", "5mg"]
    },
    {
        "name": "Kemadrin",
        "generic_name": "Procyclidine Hydrochloride",
        "common_dosages": ["5mg"]
    },
    
    # Cognitive Enhancer Brand Names
    {
        "name": "Aricept",
        "generic_name": "Donepezil Hydrochloride",
        "common_dosages": ["5mg", "10mg"]
    },
    {
        "name": "Donep",
        "generic_name": "Donepezil Hydrochloride",
        "common_dosages": ["5mg", "10mg"]
    },
    {
        "name": "Namenda",
        "generic_name": "Memantine Hydrochloride",
        "common_dosages": ["5mg", "10mg"]
    },
    {
        "name": "Exelon",
        "generic_name": "Rivastigmine Tartrate",
        "common_dosages": ["1.5mg", "3mg", "4.5mg", "6mg"]
    }
]

def seed_medications():
    """Seed the medications table with comprehensive psychiatric medications."""
    
    print("=" * 60)
    print("Psychiatric Medications Seed Script")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        added_count = 0
        skipped_count = 0
        
        for med_data in medications_data:
            # Check if medication already exists
            existing = db.query(Medication).filter(
                Medication.name == med_data["name"]
            ).first()
            
            if existing:
                print(f"  ⚠️  {med_data['name']} already exists, skipping...")
                skipped_count += 1
                continue
            
            # Create new medication using ORM
            medication = Medication(
                name=med_data["name"],
                generic_name=med_data["generic_name"],
                common_dosages=med_data["common_dosages"]
            )
            
            db.add(medication)
            print(f"  ✓ Added: {med_data['name']} ({len(med_data['common_dosages'])} dosages)")
            added_count += 1
        
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Seeding completed!")
        print(f"   Added: {added_count} medications")
        print(f"   Skipped: {skipped_count} (already exist)")
        print(f"   Total in database: {added_count + skipped_count}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error seeding medications: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_medications()
