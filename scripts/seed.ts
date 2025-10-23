
import { PrismaClient, UserRole, ServiceType, AppointmentStatus, TransactionType, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (in reverse dependency order)
  await prisma.sessionNote.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.clientPackage.deleteMany();
  await prisma.packageService.deleteMany();
  await prisma.package.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();
  await prisma.personnel.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for all test users
  const hashedPassword = await bcrypt.hash('johndoe123', 12);

  // 1. Create test users with different roles
  const adminUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe',
      role: UserRole.ADMINISTRATOR,
      isActive: true
    }
  });

  const psychologistUser = await prisma.user.create({
    data: {
      email: 'psikolog@klinik.com',
      password: hashedPassword,
      name: 'Dr. Ayşe Yılmaz',
      role: UserRole.PSYCHOLOGIST,
      isActive: true
    }
  });

  const coordinatorUser = await prisma.user.create({
    data: {
      email: 'koordinator@klinik.com',
      password: hashedPassword,
      name: 'Mehmet Demir',
      role: UserRole.COORDINATOR,
      isActive: true
    }
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'danisan@email.com',
      password: hashedPassword,
      name: 'Fatma Özkan',
      role: UserRole.CLIENT,
      isActive: true
    }
  });

  // 2. Create personnel records
  const psychologist = await prisma.personnel.create({
    data: {
      userId: psychologistUser.id,
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      phone: '+90 532 123 4567',
      specialization: 'Klinik Psikolog, Bilişsel Davranışçı Terapi',
      workingHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '15:00' },
        saturday: { start: '10:00', end: '14:00' },
        sunday: null
      },
      isActive: true
    }
  });

  const coordinator = await prisma.personnel.create({
    data: {
      userId: coordinatorUser.id,
      firstName: 'Mehmet',
      lastName: 'Demir',
      phone: '+90 532 987 6543',
      specialization: 'Klinik Koordinatörü',
      workingHours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: null,
        sunday: null
      },
      isActive: true
    }
  });

  // 3. Create client record
  const client = await prisma.client.create({
    data: {
      userId: clientUser.id,
      firstName: 'Fatma',
      lastName: 'Özkan',
      phone: '+90 532 555 1234',
      dateOfBirth: new Date('1985-06-15'),
      emergencyContact: 'Ali Özkan (Eş)',
      emergencyPhone: '+90 532 555 5678',
      kvkk_consent: true,
      consentDate: new Date(),
      isActive: true
    }
  });

  // Add more test clients
  const client2User = await prisma.user.create({
    data: {
      email: 'ahmet@email.com',
      password: hashedPassword,
      name: 'Ahmet Kaya',
      role: UserRole.CLIENT,
      isActive: true
    }
  });

  const client2 = await prisma.client.create({
    data: {
      userId: client2User.id,
      firstName: 'Ahmet',
      lastName: 'Kaya',
      phone: '+90 533 111 2222',
      dateOfBirth: new Date('1990-03-20'),
      emergencyContact: 'Zeynep Kaya (Anne)',
      emergencyPhone: '+90 533 111 3333',
      kvkk_consent: true,
      consentDate: new Date(),
      isActive: true
    }
  });

  // 4. Create services
  const individualTherapy = await prisma.service.create({
    data: {
      name: 'Bireysel Terapi',
      description: 'Kişiye özel bireysel psikolojik destek ve terapi seansları',
      duration: 50,
      price: 800.0,
      serviceType: ServiceType.INDIVIDUAL_THERAPY,
      isActive: true
    }
  });

  const couplesTherapy = await prisma.service.create({
    data: {
      name: 'Çift Terapisi',
      description: 'Çiftler arası iletişim ve ilişki sorunları için terapi',
      duration: 60,
      price: 1200.0,
      serviceType: ServiceType.COUPLES_THERAPY,
      isActive: true
    }
  });

  const familyTherapy = await prisma.service.create({
    data: {
      name: 'Aile Terapisi',
      description: 'Aile içi dinamikler ve sorunlar için terapi',
      duration: 60,
      price: 1000.0,
      serviceType: ServiceType.FAMILY_THERAPY,
      isActive: true
    }
  });

  const childTherapy = await prisma.service.create({
    data: {
      name: 'Çocuk ve Ergen Terapisi',
      description: 'Çocuk ve ergen ruh sağlığı için özel terapi',
      duration: 45,
      price: 700.0,
      serviceType: ServiceType.CHILD_ADOLESCENT_THERAPY,
      isActive: true
    }
  });

  const onlineTherapy = await prisma.service.create({
    data: {
      name: 'Online Terapi',
      description: 'Video görüşme ile online psikolojik destek',
      duration: 50,
      price: 600.0,
      serviceType: ServiceType.ONLINE_THERAPY,
      isActive: true
    }
  });

  // 5. Create packages
  const individualPackage = await prisma.package.create({
    data: {
      name: '10 Seans Bireysel Terapi Paketi',
      description: '10 bireysel terapi seansı içeren avantajlı paket',
      totalSessions: 10,
      totalPrice: 7200.0, // 10% discount
      discountPercent: 10.0,
      validityDays: 180,
      isActive: true
    }
  });

  await prisma.packageService.create({
    data: {
      packageId: individualPackage.id,
      serviceId: individualTherapy.id,
      sessions: 10
    }
  });

  // 6. Create appointments
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointment1 = await prisma.appointment.create({
    data: {
      clientId: client.id,
      personnelId: psychologist.id,
      serviceId: individualTherapy.id,
      appointmentDate: tomorrow,
      duration: 50,
      status: AppointmentStatus.SCHEDULED,
      notes: 'İlk terapi seansı',
      price: 800.0
    }
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      clientId: client2.id,
      personnelId: psychologist.id,
      serviceId: onlineTherapy.id,
      appointmentDate: nextWeek,
      duration: 50,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Online terapi seansı',
      price: 600.0
    }
  });

  // 7. Create transactions
  await prisma.transaction.create({
    data: {
      appointmentId: appointment1.id,
      clientId: client.id,
      amount: 800.0,
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      description: 'Bireysel terapi ödemesi'
    }
  });

  await prisma.transaction.create({
    data: {
      amount: 150.0,
      type: TransactionType.EXPENSE,
      paymentMethod: PaymentMethod.CASH,
      description: 'Ofis malzemeleri',
      category: 'Genel Giderler'
    }
  });

  // 8. Create client package
  const clientPackage = await prisma.clientPackage.create({
    data: {
      clientId: client.id,
      packageId: individualPackage.id,
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
      sessionsUsed: 1,
      isActive: true
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('Test accounts created:');
  console.log('- Administrator: john@doe.com / johndoe123');
  console.log('- Psychologist: psikolog@klinik.com / johndoe123');
  console.log('- Coordinator: koordinator@klinik.com / johndoe123');
  console.log('- Client: danisan@email.com / johndoe123');
  console.log('- Client 2: ahmet@email.com / johndoe123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
