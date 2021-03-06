from django.conf import settings

SET_TIMEZONE = f"SET TIMEZONE='{settings.NC_TIME_ZONE}'"  # noqa

CLEAN_DATABASE = """
    TRUNCATE "nc_stop" RESTART IDENTITY CASCADE;
    TRUNCATE "nc_person" RESTART IDENTITY CASCADE;
    TRUNCATE "nc_search" RESTART IDENTITY CASCADE;
    TRUNCATE "nc_searchbasis" RESTART IDENTITY CASCADE;
    TRUNCATE "nc_contraband" RESTART IDENTITY CASCADE;
    TRUNCATE "nc_agency" RESTART IDENTITY CASCADE;
"""  # noqa

# NC_COPY_INSTRUCTIONS:
# KEY: Filename that will be found on the file system.
# VALUE: The SQL COPY statement.
# The SQL COPY statement is used with psycopg2's expert_copy which requires the FROM statement to be STDIN
NC_COPY_INSTRUCTIONS = {
    "Stop.csv": "COPY nc_stop (stop_id, agency_description, date, purpose, action, driver_arrest, passenger_arrest, encounter_force, engage_force, officer_injury, driver_injury, passenger_injury, officer_id, stop_location, stop_city) FROM STDIN WITH  DELIMITER ',' NULL AS '' CSV HEADER FORCE NOT NULL officer_id, stop_city, stop_location",
    "PERSON.csv": "COPY nc_person (person_id, stop_id, type, age, gender, ethnicity, race) FROM STDIN WITH DELIMITER ',' NULL AS '' CSV HEADER FORCE NOT NULL ethnicity, gender, race",
    "Search.csv": "COPY nc_search (search_id, stop_id, person_id, type, vehicle_search, driver_search, passenger_search, property_search, vehicle_siezed, personal_property_siezed, other_property_sized) FROM STDIN WITH DELIMITER ',' NULL AS '' CSV HEADER",
    "Contraband.csv": "COPY nc_contraband (contraband_id, search_id, person_id, stop_id, ounces, pounds, pints, gallons, dosages, grams, kilos, money, weapons, dollar_amount) FROM STDIN WITH DELIMITER ',' CSV HEADER",
    "SearchBasis.csv": "COPY nc_searchbasis (search_basis_id, search_id, person_id, stop_id, basis) FROM STDIN WITH DELIMITER ',' CSV HEADER",
}  # noqa

NC_AGENCY_COPY_INSTRUCTIONS = "COPY nc_agency (id, name, census_profile_id) FROM STDIN WITH DELIMITER ',' CSV HEADER FORCE NOT NULL census_profile_id"

FINALIZE_COPY = """
    UPDATE nc_stop SET agency_id = nc_agency.id FROM nc_agency WHERE nc_stop.agency_description = nc_agency.name;

    ANALYZE;

    ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_pkey" PRIMARY KEY (stop_id);
    ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasis_pkey" PRIMARY KEY (search_basis_id);
    ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_pkey" PRIMARY KEY (search_id);
    ALTER TABLE "public"."nc_person" ADD CONSTRAINT "nc_person_pkey" PRIMARY KEY (person_id);
    ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_pkey" PRIMARY KEY (contraband_id);
    ALTER TABLE "public"."nc_agency" ADD CONSTRAINT "nc_agency_pkey" PRIMARY KEY (id);
    ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_stop_id_check" CHECK ((stop_id >= 0));
    ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_purpose_check" CHECK ((purpose >= 0));
    ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_action_check" CHECK ((action >= 0));
    ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_type_check" CHECK ((type >= 0));
    ALTER TABLE "public"."nc_person" ADD CONSTRAINT "nc_person_age_check" CHECK ((age >= 0));
    ALTER TABLE "public"."nc_stop" ADD CONSTRAINT "nc_stop_agency_id_f050f703620f44c_fk_nc_agency_id" FOREIGN KEY (agency_id) REFERENCES nc_agency(id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasis_stop_id_36f52da3736812d4_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasi_search_id_3e2dcf5dc9fc212f_fk_nc_search_search_id" FOREIGN KEY (search_id) REFERENCES nc_search(search_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_searchbasis" ADD CONSTRAINT "nc_searchbasi_person_id_3500809179032efb_fk_nc_person_person_id" FOREIGN KEY (person_id) REFERENCES nc_person(person_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_stop_id_631cf86a83f3528_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_search" ADD CONSTRAINT "nc_search_person_id_13b611eaa9879eb9_fk_nc_person_person_id" FOREIGN KEY (person_id) REFERENCES nc_person(person_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_person" ADD CONSTRAINT "nc_person_stop_id_391c330ed82da305_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_stop_id_77ce6cabcbe40c3c_fk_nc_stop_stop_id" FOREIGN KEY (stop_id) REFERENCES nc_stop(stop_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_search_id_7ead089372beb55f_fk_nc_search_search_id" FOREIGN KEY (search_id) REFERENCES nc_search(search_id) DEFERRABLE INITIALLY DEFERRED;
    ALTER TABLE "public"."nc_contraband" ADD CONSTRAINT "nc_contraband_person_id_50e4f1b98b0285ab_fk_nc_person_person_id" FOREIGN KEY (person_id) REFERENCES nc_person(person_id) DEFERRABLE INITIALLY DEFERRED;
    CREATE INDEX nc_contraband_5fad4402 ON nc_contraband USING btree (search_id);
    CREATE INDEX nc_contraband_91455da7 ON nc_contraband USING btree (stop_id);
    CREATE INDEX nc_contraband_a8452ca7 ON nc_contraband USING btree (person_id);
    CREATE INDEX nc_person_91455da7 ON nc_person USING btree (stop_id);
    CREATE INDEX nc_search_91455da7 ON nc_search USING btree (stop_id);
    CREATE INDEX nc_search_a8452ca7 ON nc_search USING btree (person_id);
    CREATE INDEX nc_searchbasis_5fad4402 ON nc_searchbasis USING btree (search_id);
    CREATE INDEX nc_searchbasis_91455da7 ON nc_searchbasis USING btree (stop_id);
    CREATE INDEX nc_searchbasis_a8452ca7 ON nc_searchbasis USING btree (person_id);
    CREATE INDEX nc_stop_169fc544 ON nc_stop USING btree (agency_id);
    CREATE INDEX nc_stop_date_7d643c8a9c590bf7_uniq ON nc_stop USING btree (date);

    ANALYZE;
"""  # noqa
