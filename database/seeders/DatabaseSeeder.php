<?php

namespace Database\Seeders;

use App\Models\SpecField;
use App\Models\StageDefinition;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@jobflow.local'],
            ['name' => 'المدير', 'role' => 'admin', 'phone' => '0568112218', 'password' => '0568112218']
        );

        // The full pipeline, admin-editable from /admin/stages. Stages
        // sharing a sort_order run in parallel (cnc/printing/iron all
        // happen at once after design, exactly like before this became
        // configurable).
        $stages = [
            ['name_ar' => 'استلام الطلبية', 'slug' => 'intake', 'sort_order' => 0, 'is_conditional' => false, 'is_intake' => true],
            ['name_ar' => 'التصميم', 'slug' => 'design', 'sort_order' => 10, 'is_conditional' => false],
            ['name_ar' => 'قص CNC', 'name_en' => 'CNC Cutting', 'slug' => 'cnc', 'sort_order' => 20, 'is_conditional' => true],
            ['name_ar' => 'طباعة', 'name_en' => 'Printing', 'slug' => 'printing', 'sort_order' => 20, 'is_conditional' => true],
            ['name_ar' => 'فريم حديد', 'name_en' => 'Iron Frame', 'slug' => 'iron', 'sort_order' => 20, 'is_conditional' => true],
            ['name_ar' => 'التجميع', 'slug' => 'assembly', 'sort_order' => 30, 'is_conditional' => false],
            ['name_ar' => 'التركيب', 'slug' => 'installation', 'sort_order' => 40, 'is_conditional' => false],
        ];

        foreach ($stages as $stage) {
            StageDefinition::firstOrCreate(['slug' => $stage['slug']], $stage);
        }

        $specFields = [
            ['key' => 'size', 'label_ar' => 'الحجم', 'field_type' => 'text', 'sort_order' => 1],
            ['key' => 'color', 'label_ar' => 'اللون', 'field_type' => 'text', 'sort_order' => 2],
            ['key' => 'lighting_color', 'label_ar' => 'لون الإضاءة', 'field_type' => 'select', 'options' => ['أبيض', 'أصفر دافئ', 'RGB متعدد الألوان'], 'sort_order' => 3],
            ['key' => 'width_cm', 'label_ar' => 'العرض (سم)', 'field_type' => 'number', 'sort_order' => 4],
            ['key' => 'height_cm', 'label_ar' => 'الارتفاع (سم)', 'field_type' => 'number', 'sort_order' => 5],
        ];

        foreach ($specFields as $sf) {
            SpecField::firstOrCreate(['key' => $sf['key']], $sf);
        }

        // Real workshop roster. Password defaults to each worker's own local
        // phone number (easy for the owner to hand out, unique per person).
        $employees = [
            ['name' => 'هديل', 'email' => 'hadeel@jobflow.local', 'phone' => '0598088792', 'permissions' => ['stage.design']],
            ['name' => 'منير الجعبري', 'email' => 'mounir@jobflow.local', 'phone' => '0595331973', 'permissions' => ['stage.installation']],
            ['name' => 'محمد القواسمة', 'email' => 'mohammad@jobflow.local', 'phone' => '0597547457', 'permissions' => ['stage.iron', 'stage.installation']],
            ['name' => 'يوسف', 'email' => 'yousef@jobflow.local', 'phone' => '0598046944', 'permissions' => ['stage.assembly']],
            ['name' => 'مروان', 'email' => 'marwan@jobflow.local', 'phone' => '0569134735', 'permissions' => ['stage.cnc', 'stage.printing']],
            ['name' => 'عبد', 'email' => 'abed@jobflow.local', 'phone' => '0597647913', 'permissions' => ['stage.cnc']],
        ];

        foreach ($employees as $employee) {
            $user = User::firstOrCreate(
                ['email' => $employee['email']],
                ['name' => $employee['name'], 'phone' => $employee['phone'], 'role' => 'worker', 'password' => $employee['phone']]
            );
            $user->syncPermissions($employee['permissions']);
        }
    }
}
