using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using sweetVenomServer.Models;

namespace sweetVenomServer.Data;

public partial class CakeShopContext : DbContext
{
    public CakeShopContext(DbContextOptions<CakeShopContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Biscuit> Biscuits { get; set; }

    public virtual DbSet<Cake> Cakes { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Cream> Creams { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<SavedCake> SavedCakes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Biscuit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Biscuits__3214EC07C91D935A");

            entity.Property(e => e.ExtraPrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Cake>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Cakes__3214EC07CE8EA47F");

            entity.Property(e => e.BasePrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.IsAvailable).HasDefaultValue(true);
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.PhotoUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("PhotoURL");

            entity.HasOne(d => d.Category).WithMany(p => p.Cakes)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK__Cakes__CategoryI__571DF1D5");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Categori__3214EC07E83841B4");

            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Cream>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Creams__3214EC075ED4E427");

            entity.Property(e => e.ExtraPrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Orders__3214EC076E32AD8C");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeliveryDate).HasColumnType("datetime");
            entity.Property(e => e.Note)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("Unpaid");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Client).WithMany(p => p.Orders)
                .HasForeignKey(d => d.ClientId)
                .HasConstraintName("FK__Orders__ClientId__5AEE82B9");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__OrderIte__3214EC071D5906C5");

            entity.Property(e => e.ItemPrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Biscuit).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.BiscuitId)
                .HasConstraintName("FK__OrderItem__Biscu__628FA481");

            entity.HasOne(d => d.Cake).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.CakeId)
                .HasConstraintName("FK__OrderItem__CakeI__619B8048");

            entity.HasOne(d => d.Cream).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.CreamId)
                .HasConstraintName("FK__OrderItem__Cream__6383C8BA");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK__OrderItem__Order__60A75C0F");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC07ED9A6E13");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D105343D3C4C35").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("phone");
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
