import { Patient } from '../../types/patient';

export class PatientNumberService {
  private static STORAGE_KEY = 'patient_numbers';
  private static NUMBER_PREFIX = 'P';
  private static NUMBER_LENGTH = 4;

  public static getNextPatientNumber(): string {
    const usedNumbers = this.getUsedNumbers();
    
    // Find the first available number starting from 1
    let nextNumber = 1;
    while (nextNumber <= 9999) {
      const formattedNumber = this.formatNumber(nextNumber);
      if (!usedNumbers.has(formattedNumber)) {
        return formattedNumber;
      }
      nextNumber++;
    }

    throw new Error('No available patient numbers');
  }

  public static formatNumber(num: number): string {
    return `${this.NUMBER_PREFIX}${num.toString().padStart(this.NUMBER_LENGTH, '0')}`;
  }

  public static findOrGeneratePatientNumber(nom: string, prenom: string, patients: Patient[]): string {
    // Check if patient already exists
    const existingPatient = patients.find(p => 
      p.nom.toLowerCase() === nom.toLowerCase() && 
      p.prenom.toLowerCase() === prenom.toLowerCase()
    );

    if (existingPatient) {
      return existingPatient.numeroPatient;
    }

    // Find the lowest available number
    const usedNumbers = new Set(patients.map(p => p.numeroPatient));
    let nextNumber = 1;
    while (true) {
      const candidateNumber = this.formatNumber(nextNumber);
      if (!usedNumbers.has(candidateNumber)) {
        return candidateNumber;
      }
      nextNumber++;
    }
  }

  public static isNumberAvailable(number: string, patients: Patient[]): boolean {
    // Check if number is already used by an existing patient
    const isUsedByPatient = patients.some(p => p.numeroPatient === number);
    if (isUsedByPatient) {
      return false;
    }

    // Check if number is reserved
    const usedNumbers = this.getUsedNumbers();
    return !usedNumbers.has(number);
  }

  public static validateNumber(number: string): boolean {
    const pattern = new RegExp(`^${this.NUMBER_PREFIX}\\d{${this.NUMBER_LENGTH}}$`);
    return pattern.test(number);
  }

  public static releaseNumber(number: string, patients: Patient[]): boolean {
    // Check if number is used by another patient
    const isUsedByOther = patients.some(p => p.numeroPatient === number);
    if (!isUsedByOther) {
      const usedNumbers = this.getUsedNumbers();
      usedNumbers.delete(number);
      this.saveUsedNumbers(usedNumbers);
      return true;
    }
    return false;
  }

  public static reserveNumber(number: string): void {
    if (!this.validateNumber(number)) {
      throw new Error(`Invalid patient number format. Expected format: ${this.NUMBER_PREFIX}XXXX`);
    }
    const usedNumbers = this.getUsedNumbers();
    usedNumbers.add(number);
    this.saveUsedNumbers(usedNumbers);
  }

  private static getUsedNumbers(): Set<string> {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return new Set(saved ? JSON.parse(saved) : []);
  }

  private static saveUsedNumbers(numbers: Set<string>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(numbers)));
  }

  public static reorganizeNumbers(patients: Patient[]): void {
    const usedNumbers = new Set<string>();
    
    // Sort patients by current number
    const sortedPatients = [...patients].sort((a, b) => {
      const numA = parseInt(a.numeroPatient.replace(this.NUMBER_PREFIX, ''));
      const numB = parseInt(b.numeroPatient.replace(this.NUMBER_PREFIX, ''));
      return numA - numB;
    });

    // Reassign numbers sequentially starting from 1
    sortedPatients.forEach((patient, index) => {
      const newNumber = this.formatNumber(index + 1);
      patient.numeroPatient = newNumber;
      usedNumbers.add(newNumber);
    });

    this.saveUsedNumbers(usedNumbers);
  }
}