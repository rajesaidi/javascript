import React, { forwardRef, memo, useEffect, useMemo, useRef } from 'react';

import { useCoreClerk } from '../../contexts';
import { descriptors, Flex, Icon, Input, Text } from '../../customizables';
import { Select, SelectButton, SelectOptionList } from '../../elements';
import { Check } from '../../icons';
import type { PropsOfComponent } from '../../styledSystem';
import { mergeRefs } from '../../utils';
import type { CountryEntry, CountryIso } from './countryCodeData';
import { IsoToCountryMap } from './countryCodeData';
import { useFormattedPhoneNumber } from './useFormattedPhoneNumber';

const createSelectOption = (country: CountryEntry) => {
  return {
    searchTerm: `${country.iso} ${country.name} ${country.code}`,
    value: `${country.iso} ${country.name} ${country.code}`,
    country,
    // nativeOption: createNativeSelectOption(country),
  };
};

const countryOptions = [...IsoToCountryMap.values()].map(createSelectOption);

type PhoneInputProps = PropsOfComponent<typeof Input> & { locationBasedCountryIso?: CountryIso };

const PhoneInputBase = forwardRef<HTMLInputElement, PhoneInputProps>((props, ref) => {
  const { onChange: onChangeProp, value, locationBasedCountryIso, sx, ...rest } = props;
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const { setNumber, setIso, setNumberAndIso, numberWithCode, iso, formattedNumber } = useFormattedPhoneNumber({
    initPhoneWithCode: value as string,
    locationBasedCountryIso,
  });

  const callOnChangeProp = () => {
    // Quick and dirty way to match this component's public API
    // with every other Input component, so we can use the same helpers
    // without worrying about the underlying implementation details
    onChangeProp?.({ target: { value: numberWithCode } } as any);
  };

  const selectedCountryOption = useMemo(() => {
    return countryOptions.find(o => o.country.iso === iso) || countryOptions[0];
  }, [iso]);

  useEffect(callOnChangeProp, [numberWithCode]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const inputValue = e.clipboardData.getData('text');
    if (inputValue.includes('+')) {
      setNumberAndIso(inputValue);
    } else {
      setNumber(inputValue);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue.includes('+')) {
      setNumberAndIso(inputValue);
    } else {
      setNumber(inputValue);
    }
  };

  return (
    <Flex
      elementDescriptor={descriptors.phoneInputBox}
      direction='row'
      hasError={rest.hasError}
      sx={theme => ({
        position: 'relative',
        borderRadius: theme.radii.$md,
        zIndex: 1,
        border: theme.borders.$normal,
        borderColor: theme.colors.$blackAlpha300, // we use this value in the Input primitive
      })}
    >
      <Select
        elementId='countryCode'
        value={selectedCountryOption.value}
        options={countryOptions}
        renderOption={(option, _index, isSelected) => (
          <CountryCodeListItem
            sx={theme => ({
              '&:hover, &[data-focused="true"]': {
                backgroundColor: theme.colors.$blackAlpha200,
              },
            })}
            isSelected={isSelected}
            country={option.country}
          />
        )}
        onChange={option => {
          setIso(option.country.iso);
          phoneInputRef.current?.focus();
        }}
        noResultsMessage='No countries found'
        searchPlaceholder='Search country or code'
        comparator={(term, option) => option.searchTerm.toLowerCase().includes(term.toLowerCase())}
      >
        <SelectButton
          sx={{
            border: 'none',
            borderBottomRightRadius: '0',
            borderTopRightRadius: '0',
            zIndex: 2,
          }}
          isDisabled={rest.isDisabled}
        >
          <Text
            sx={{
              textTransform: 'uppercase',
            }}
          >
            {iso}
          </Text>
        </SelectButton>
        <SelectOptionList
          sx={{ width: '100%', padding: '0 0' }}
          containerSx={{ gap: 0 }}
        />
      </Select>

      <Flex sx={{ position: 'relative', width: '100%', marginLeft: 1 }}>
        <Text
          variant='smallRegular'
          sx={{ position: 'absolute', left: '1ch', top: '50%', transform: 'translateY(-50%)' }}
        >
          +{selectedCountryOption.country.code}
        </Text>
        <Input
          value={formattedNumber}
          onPaste={handlePaste}
          onChange={handlePhoneNumberChange}
          maxLength={25}
          type='tel'
          sx={[
            {
              border: 'none',
              height: '100%',
              borderTopLeftRadius: '0',
              borderBottomLeftRadius: '0',
              paddingLeft: `${`+${selectedCountryOption.country.code}`.length + 1.5}ch`,
            },
            sx,
          ]}
          //use our internal ref while forwarding
          //@ts-expect-error
          ref={mergeRefs(phoneInputRef, ref)}
          {...rest}
        />
      </Flex>
    </Flex>
  );
});

type CountryCodeListItemProps = PropsOfComponent<typeof Flex> & {
  isSelected?: boolean;
  country: CountryEntry;
};
const CountryCodeListItem = memo((props: CountryCodeListItemProps) => {
  const { country, isSelected, sx, ...rest } = props;
  return (
    <Flex
      center
      sx={[
        theme => ({
          width: '100%',
          gap: theme.space.$2,
          padding: `${theme.space.$0x5} ${theme.space.$4}`,
        }),
        sx,
      ]}
      {...rest}
    >
      <Icon
        icon={Check}
        size='sm'
        sx={{ visibility: isSelected ? 'visible' : 'hidden' }}
      />
      <Text
        as='div'
        variant='regularRegular'
        sx={{ width: '100%' }}
      >
        {country.name}
      </Text>
      <Text
        variant='smallRegular'
        colorScheme='neutral'
      >
        +{country.code}
      </Text>
    </Flex>
  );
});

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>((props, ref) => {
  // @ts-expect-error
  const { __internal_country } = useCoreClerk();

  return (
    <PhoneInputBase
      {...props}
      locationBasedCountryIso={__internal_country as CountryIso}
      ref={ref}
    />
  );
});