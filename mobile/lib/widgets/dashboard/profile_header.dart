import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:simpels_mobile/providers/auth_provider.dart';
import 'package:simpels_mobile/models/santri_model.dart';

class ProfileHeader extends StatelessWidget {
  final void Function() onTapSelector;

  const ProfileHeader({super.key, required this.onTapSelector});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final santri = authProvider.activeSantri;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          _buildAvatar(context, santri),
          const SizedBox(height: 16),
          authProvider.santriList.length > 1
              ? InkWell(
                  onTap: onTapSelector,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(26),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          santri?.nama ?? 'Nama Santri',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 28),
                      ],
                    ),
                  ),
                )
              : Text(
                  santri?.nama ?? 'Nama Santri',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  textAlign: TextAlign.center,
                ),
          const SizedBox(height: 8),
          Text(
            'NIS: ${santri?.nis ?? '-'} • ${santri?.kelas ?? 'Belum ada kelas'}',
            style: TextStyle(fontSize: 14, color: Colors.white.withAlpha(230)),
          ),
          if (santri?.asrama != null) ...[
            const SizedBox(height: 4),
            Text(
              'Asrama: ${santri!.asrama}',
              style: TextStyle(fontSize: 14, color: Colors.white.withAlpha(230)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar(BuildContext context, SantriModel? santri) {
    final hasFoto = santri?.fotoUrl != null && santri?.fotoUrl?.isNotEmpty == true;
    return CircleAvatar(
      radius: 50,
      backgroundColor: Colors.white,
      backgroundImage: hasFoto ? NetworkImage(santri!.fotoUrl!) : null,
      child: !hasFoto
          ? Icon(
              santri?.jenisKelamin == 'L' ? Icons.boy : Icons.girl,
              size: 50,
              color: Theme.of(context).colorScheme.primary,
            )
          : null,
    );
  }
}
