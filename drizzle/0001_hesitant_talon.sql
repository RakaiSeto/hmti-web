CREATE TABLE `barang` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`kategori_id` text NOT NULL,
	`jumlah` integer DEFAULT 0 NOT NULL,
	`kondisi` text DEFAULT 'baik' NOT NULL,
	`lokasi` text,
	`deskripsi` text,
	`foto_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`kategori_id`) REFERENCES `kategori`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `barang_kategori_idx` ON `barang` (`kategori_id`);--> statement-breakpoint
CREATE TABLE `kategori` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kategori_nama_unique` ON `kategori` (`nama`);--> statement-breakpoint
CREATE TABLE `log_aktivitas` (
	`id` text PRIMARY KEY NOT NULL,
	`pengguna_id` text,
	`pengguna_nama` text,
	`aksi` text NOT NULL,
	`entitas` text NOT NULL,
	`entitas_id` text,
	`waktu` integer NOT NULL,
	FOREIGN KEY (`pengguna_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `log_waktu_idx` ON `log_aktivitas` (`waktu`);--> statement-breakpoint
CREATE TABLE `pengajuan` (
	`id` text PRIMARY KEY NOT NULL,
	`kode` text NOT NULL,
	`organisasi` text NOT NULL,
	`penanggung_jawab` text NOT NULL,
	`kontak` text NOT NULL,
	`tgl_pinjam` text NOT NULL,
	`tgl_kembali` text NOT NULL,
	`keperluan` text NOT NULL,
	`status` text DEFAULT 'Diajukan' NOT NULL,
	`alasan_penolakan` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pengajuan_kode_unique` ON `pengajuan` (`kode`);--> statement-breakpoint
CREATE INDEX `pengajuan_status_tgl_idx` ON `pengajuan` (`status`,`tgl_pinjam`,`tgl_kembali`);--> statement-breakpoint
CREATE TABLE `pengajuan_barang` (
	`id` text PRIMARY KEY NOT NULL,
	`pengajuan_id` text NOT NULL,
	`barang_id` text NOT NULL,
	`jumlah` integer NOT NULL,
	FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`barang_id`) REFERENCES `barang`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `pengajuan_barang_barang_idx` ON `pengajuan_barang` (`barang_id`);--> statement-breakpoint
CREATE INDEX `pengajuan_barang_pengajuan_idx` ON `pengajuan_barang` (`pengajuan_id`);--> statement-breakpoint
CREATE TABLE `pengembalian` (
	`id` text PRIMARY KEY NOT NULL,
	`pengajuan_id` text NOT NULL,
	`catatan` text,
	`dicatat_oleh` text NOT NULL,
	`waktu` integer NOT NULL,
	FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dicatat_oleh`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pengembalian_pengajuan_id_unique` ON `pengembalian` (`pengajuan_id`);--> statement-breakpoint
CREATE TABLE `pengembalian_item` (
	`id` text PRIMARY KEY NOT NULL,
	`pengembalian_id` text NOT NULL,
	`barang_id` text NOT NULL,
	`kondisi` text NOT NULL,
	`jumlah` integer DEFAULT 1 NOT NULL,
	`catatan` text,
	FOREIGN KEY (`pengembalian_id`) REFERENCES `pengembalian`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`barang_id`) REFERENCES `barang`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `pengembalian_item_barang_idx` ON `pengembalian_item` (`barang_id`);--> statement-breakpoint
CREATE TABLE `serah_terima` (
	`id` text PRIMARY KEY NOT NULL,
	`pengajuan_id` text NOT NULL,
	`penerima` text NOT NULL,
	`catatan` text,
	`dicatat_oleh` text NOT NULL,
	`waktu` integer NOT NULL,
	FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dicatat_oleh`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `serah_terima_pengajuan_id_unique` ON `serah_terima` (`pengajuan_id`);--> statement-breakpoint
CREATE TABLE `serah_terima_item` (
	`id` text PRIMARY KEY NOT NULL,
	`serah_terima_id` text NOT NULL,
	`barang_id` text NOT NULL,
	`kondisi` text NOT NULL,
	FOREIGN KEY (`serah_terima_id`) REFERENCES `serah_terima`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`barang_id`) REFERENCES `barang`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `surat` (
	`id` text PRIMARY KEY NOT NULL,
	`pengajuan_id` text NOT NULL,
	`file_path` text NOT NULL,
	`nama_file` text,
	`status_verifikasi` text DEFAULT 'diterima' NOT NULL,
	`diunggah_oleh` text NOT NULL,
	`waktu` integer NOT NULL,
	`diverifikasi_oleh` text,
	`waktu_verifikasi` integer,
	FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`diunggah_oleh`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`diverifikasi_oleh`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `surat_pengajuan_id_unique` ON `surat` (`pengajuan_id`);